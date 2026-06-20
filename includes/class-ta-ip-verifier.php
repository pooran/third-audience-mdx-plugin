<?php
/**
 * IP Verification Service - Verifies bot identity by IP address.
 *
 * Validates bot claims by checking if IP matches official bot IP ranges.
 * Catches masked bots like ChatGPT Atlas (browser UA but OpenAI IP).
 *
 * @package ThirdAudience
 * @since   2.7.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class TA_IP_Verifier
 *
 * Verifies bot identity using IP ranges and reverse DNS.
 *
 * @since 2.7.0
 */
class TA_IP_Verifier {

	/**
	 * Fallback hardcoded bot IP ranges (used when dynamic fetch fails).
	 *
	 * @var array
	 */
	private static $bot_ip_ranges = array(
		'GPTBot'            => array(
			'23.98.142.0/24',
			'40.84.180.0/22',
			'13.66.11.96/28',
		),
		'ChatGPT-User'      => array(
			'23.98.142.0/24',
			'40.84.180.0/22',
		),
		'OAI-SearchBot'     => array(
			'23.98.142.0/24',
			'40.84.180.0/22',
			'13.66.11.96/28',
		),
		'ClaudeBot'         => array(
			'3.128.0.0/9',
			'52.15.0.0/16',
			'18.216.0.0/14',
		),
		'PerplexityBot'     => array(
			'44.214.0.0/16',
			'52.20.0.0/14',
		),
		'GoogleBot'         => array(
			'66.249.64.0/19',
			'66.102.0.0/20',
		),
		'Googlebot'         => array(
			'66.249.64.0/19',
			'66.102.0.0/20',
		),
		'Google-Extended'   => array(
			'66.249.64.0/19',
			'66.102.0.0/20',
		),
		'Bytespider'        => array(
			'110.249.0.0/16',
			'111.225.0.0/16',
		),
		'FacebookBot'       => array(
			'69.63.176.0/20',
			'31.13.24.0/21',
			'66.220.144.0/20',
		),
		'Applebot-Extended' => array(
			'17.0.0.0/8',
		),
		'Amazonbot'         => array(), // Verified via reverse DNS only.
	);

	/**
	 * Dynamic IP range sources — fetched periodically and cached.
	 *
	 * @var array
	 */
	private static $dynamic_sources = array(
		'GoogleBot'     => array(
			'url'    => 'https://developers.google.com/search/apis/ipranges/googlebot.json',
			'parser' => 'parse_google_ranges',
			'bots'   => array( 'GoogleBot', 'Googlebot', 'Google-Extended' ),
		),
		'GPTBot'        => array(
			'url'    => 'https://openai.com/gptbot-ranges.txt',
			'parser' => 'parse_openai_ranges',
			'bots'   => array( 'GPTBot', 'ChatGPT-User', 'OAI-SearchBot' ),
		),
	);

	/**
	 * Transient key for cached dynamic ranges.
	 */
	const DYNAMIC_RANGES_TRANSIENT = 'ta_dynamic_ip_ranges';

	/**
	 * Known bot types — used for "Known UA" fallback when IP can't be verified.
	 *
	 * @var array
	 */
	private static $known_bot_types = array(
		'ClaudeBot', 'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
		'PerplexityBot', 'GoogleBot', 'Googlebot', 'Google-Extended',
		'Bytespider', 'FacebookBot', 'Applebot-Extended', 'Amazonbot',
		'anthropic-ai', 'cohere-ai',
	);

	/**
	 * Reverse DNS hostname patterns.
	 *
	 * @var array
	 */
	private static $hostname_patterns = array(
		'GPTBot'            => 'openai.com',
		'ChatGPT-User'      => 'openai.com',
		'OAI-SearchBot'     => 'openai.com',
		'ClaudeBot'         => 'anthropic.com',
		'PerplexityBot'     => 'perplexity.ai',
		'GoogleBot'         => 'googlebot.com',
		'Googlebot'         => 'googlebot.com',
		'Google-Extended'   => 'google.com',
		'Bytespider'        => 'bytedance.com',
		'FacebookBot'       => 'facebook.com',
		'Applebot-Extended' => 'apple.com',
		'anthropic-ai'      => 'anthropic.com',
		'cohere-ai'         => 'cohere.ai',
		'Amazonbot'         => 'amazon.com',
	);

	/**
	 * Logger instance.
	 *
	 * @var TA_Logger
	 */
	private $logger;

	/**
	 * Singleton instance.
	 *
	 * @var TA_IP_Verifier|null
	 */
	private static $instance = null;

	/**
	 * Get singleton instance.
	 *
	 * @since 2.7.0
	 * @return TA_IP_Verifier
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 *
	 * @since 2.7.0
	 */
	private function __construct() {
		$this->logger = TA_Logger::get_instance();
	}

	/**
	 * Verify bot IP address.
	 *
	 * Checks if IP matches official bot IP ranges and validates via reverse DNS.
	 *
	 * @since 2.7.0
	 * @param string $bot_type   Bot type (e.g., 'GPTBot', 'ClaudeBot').
	 * @param string $ip_address IP address to verify.
	 * @return array Verification result with 'verified' (bool) and 'method' (string).
	 */
	public function verify_bot_ip( $bot_type, $ip_address ) {
		// Citation clicks are human visitors — bot IP verification does not apply.
		if ( 'AI_Citation' === $bot_type ) {
			return array( 'verified' => null, 'method' => null );
		}

		// Check if IP verification is enabled.
		if ( ! get_option( 'ta_enable_ip_verification', true ) ) {
			return array(
				'verified' => null,
				'method'   => null,
			);
		}

		// Validate IP format.
		if ( ! filter_var( $ip_address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_IPV6 ) ) {
			$this->logger->debug( 'Invalid IP address format for verification.', array(
				'ip'       => $ip_address,
				'bot_type' => $bot_type,
			) );
			return array(
				'verified' => false,
				'method'   => null,
			);
		}

		// Check cache first (cache for 24 hours).
		$cache_key = 'ta_ip_verify_' . md5( $bot_type . '|' . $ip_address );
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached;
		}

		// Method 1: IP range check — dynamic ranges first, fallback to hardcoded.
		$range_result = $this->verify_by_ip_range( $bot_type, $ip_address );
		if ( $range_result ) {
			$result = array(
				'verified' => true,
				'method'   => 'ip_range',
			);
			set_transient( $cache_key, $result, DAY_IN_SECONDS );
			return $result;
		}

		// Method 2: Reverse DNS lookup (slower, requires network call).
		$hostname = gethostbyaddr( $ip_address );
		if ( $hostname !== $ip_address && $this->verify_by_hostname( $bot_type, $hostname ) ) {
			// Forward DNS confirmation (verify hostname resolves back to IP).
			$forward_ips = gethostbynamel( $hostname );
			if ( is_array( $forward_ips ) && in_array( $ip_address, $forward_ips, true ) ) {
				$result = array(
					'verified' => true,
					'method'   => 'reverse_dns',
				);
				set_transient( $cache_key, $result, DAY_IN_SECONDS );

				$this->logger->debug( 'Bot IP verified via reverse DNS.', array(
					'bot_type' => $bot_type,
					'ip'       => $ip_address,
					'hostname' => $hostname,
				) );

				return $result;
			}
		}

		// IP range and reverse DNS both failed.
		// If the bot type is a known/recognized bot, return 'known_ua' so the UI
		// can show a warning badge instead of a plain dash.
		if ( in_array( $bot_type, self::$known_bot_types, true ) ) {
			$result = array(
				'verified' => null,
				'method'   => 'known_ua',
			);
			set_transient( $cache_key, $result, HOUR_IN_SECONDS * 6 );

			$this->logger->debug( 'Bot type known but IP unverifiable.', array(
				'bot_type' => $bot_type,
				'ip'       => $ip_address,
				'hostname' => $hostname ?? 'N/A',
			) );

			return $result;
		}

		// Completely unknown bot type — no status to show.
		$result = array(
			'verified' => null,
			'method'   => null,
		);
		set_transient( $cache_key, $result, HOUR_IN_SECONDS * 6 );

		$this->logger->debug( 'Bot IP verification could not be performed (unknown IP range).', array(
			'bot_type' => $bot_type,
			'ip'       => $ip_address,
			'hostname' => $hostname ?? 'N/A',
		) );

		return $result;
	}

	/**
	 * Verify by IP range.
	 *
	 * Checks dynamic (cached) ranges first, falls back to hardcoded ranges.
	 *
	 * @since 2.7.0
	 * @param string $bot_type   Bot type.
	 * @param string $ip_address IP address.
	 * @return bool True if IP is in range, false otherwise.
	 */
	private function verify_by_ip_range( $bot_type, $ip_address ) {
		// Try dynamic ranges first.
		$dynamic = get_transient( self::DYNAMIC_RANGES_TRANSIENT );
		if ( is_array( $dynamic ) && isset( $dynamic[ $bot_type ] ) ) {
			foreach ( $dynamic[ $bot_type ] as $cidr_range ) {
				if ( $this->ip_in_range( $ip_address, $cidr_range ) ) {
					return true;
				}
			}
		}

		// Fall back to hardcoded ranges.
		if ( ! isset( self::$bot_ip_ranges[ $bot_type ] ) ) {
			return false;
		}

		foreach ( self::$bot_ip_ranges[ $bot_type ] as $cidr_range ) {
			if ( $this->ip_in_range( $ip_address, $cidr_range ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Verify by reverse DNS hostname.
	 *
	 * Checks if hostname matches expected pattern for bot.
	 *
	 * @since 2.7.0
	 * @param string $bot_type Bot type.
	 * @param string $hostname Hostname from reverse DNS.
	 * @return bool True if hostname matches, false otherwise.
	 */
	private function verify_by_hostname( $bot_type, $hostname ) {
		if ( ! isset( self::$hostname_patterns[ $bot_type ] ) ) {
			return false;
		}

		$pattern = self::$hostname_patterns[ $bot_type ];
		return strpos( $hostname, $pattern ) !== false;
	}

	/**
	 * Check if IP is within CIDR range.
	 *
	 * @since 2.7.0
	 * @param string $ip   IP address to check.
	 * @param string $cidr CIDR range (e.g., '10.0.0.0/8').
	 * @return bool True if IP is in range, false otherwise.
	 */
	private function ip_in_range( $ip, $cidr ) {
		// Parse CIDR.
		list( $subnet, $mask ) = explode( '/', $cidr );

		// Convert IPs to long format.
		$ip_long     = ip2long( $ip );
		$subnet_long = ip2long( $subnet );

		// Invalid format.
		if ( false === $ip_long || false === $subnet_long ) {
			return false;
		}

		// Calculate network mask.
		$mask_long = -1 << ( 32 - (int) $mask );

		// Check if IP is in subnet.
		return ( $ip_long & $mask_long ) === ( $subnet_long & $mask_long );
	}

	/**
	 * Get bot IP ranges.
	 *
	 * Returns all known bot IP ranges (for admin display).
	 *
	 * @since 2.7.0
	 * @return array Bot IP ranges.
	 */
	public static function get_bot_ip_ranges() {
		return self::$bot_ip_ranges;
	}

	/**
	 * Add custom IP range for bot.
	 *
	 * Allows admins to add custom IP ranges via settings.
	 *
	 * @since 2.7.0
	 * @param string $bot_type Bot type.
	 * @param string $cidr_range CIDR range to add.
	 * @return bool True on success, false on failure.
	 */
	public function add_custom_ip_range( $bot_type, $cidr_range ) {
		$custom_ranges = get_option( 'ta_custom_bot_ip_ranges', array() );

		if ( ! isset( $custom_ranges[ $bot_type ] ) ) {
			$custom_ranges[ $bot_type ] = array();
		}

		if ( ! in_array( $cidr_range, $custom_ranges[ $bot_type ], true ) ) {
			$custom_ranges[ $bot_type ][] = $cidr_range;
			update_option( 'ta_custom_bot_ip_ranges', $custom_ranges );

			$this->logger->info( 'Custom IP range added.', array(
				'bot_type' => $bot_type,
				'range'    => $cidr_range,
			) );

			return true;
		}

		return false;
	}

	/**
	 * Get custom IP ranges.
	 *
	 * @since 2.7.0
	 * @return array Custom IP ranges by bot type.
	 */
	public function get_custom_ip_ranges() {
		return get_option( 'ta_custom_bot_ip_ranges', array() );
	}

	/**
	 * Fetch dynamic IP ranges from official sources and cache them.
	 *
	 * Called by daily cron. Fetches Google and OpenAI published ranges.
	 * On failure, existing cached ranges (or hardcoded fallbacks) are used.
	 *
	 * @since 2.8.0
	 * @return array Summary of fetch results per source.
	 */
	public function fetch_dynamic_ranges() {
		$results       = array();
		$merged_ranges = array();

		foreach ( self::$dynamic_sources as $source_key => $source ) {
			$response = wp_remote_get( $source['url'], array(
				'timeout'    => 10,
				'user-agent' => 'Third Audience Plugin/' . TA_VERSION,
			) );

			if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
				$results[ $source_key ] = 'fetch_failed';
				continue;
			}

			$body   = wp_remote_retrieve_body( $response );
			$ranges = $this->{$source['parser']}( $body );

			if ( empty( $ranges ) ) {
				$results[ $source_key ] = 'parse_failed';
				continue;
			}

			// Assign the same ranges to all bots that share this source.
			foreach ( $source['bots'] as $bot_type ) {
				$merged_ranges[ $bot_type ] = $ranges;
			}

			$results[ $source_key ] = count( $ranges ) . ' ranges fetched';
		}

		// Only update cache if at least one source succeeded.
		if ( ! empty( $merged_ranges ) ) {
			// Merge with existing cached data so a partial failure doesn't wipe good data.
			$existing = get_transient( self::DYNAMIC_RANGES_TRANSIENT );
			if ( is_array( $existing ) ) {
				$merged_ranges = array_merge( $existing, $merged_ranges );
			}

			set_transient( self::DYNAMIC_RANGES_TRANSIENT, $merged_ranges, DAY_IN_SECONDS );

			$this->logger->info( 'Dynamic IP ranges updated.', $results );
		}

		return $results;
	}

	/**
	 * Parse Google's Googlebot IP ranges JSON.
	 *
	 * Format: {"prefixes":[{"ipv4Prefix":"x.x.x.x/y"},{"ipv6Prefix":"..."},...]}
	 *
	 * @since 2.8.0
	 * @param string $body Response body.
	 * @return array Array of CIDR ranges (IPv4 only).
	 */
	private function parse_google_ranges( $body ) {
		$data = json_decode( $body, true );
		if ( empty( $data['prefixes'] ) ) {
			return array();
		}

		$ranges = array();
		foreach ( $data['prefixes'] as $prefix ) {
			if ( isset( $prefix['ipv4Prefix'] ) ) {
				$ranges[] = $prefix['ipv4Prefix'];
			}
		}

		return $ranges;
	}

	/**
	 * Parse OpenAI's GPTBot IP ranges text file.
	 *
	 * Format: plain text, one CIDR per line, lines starting with # are comments.
	 *
	 * @since 2.8.0
	 * @param string $body Response body.
	 * @return array Array of CIDR ranges.
	 */
	private function parse_openai_ranges( $body ) {
		$ranges = array();
		$lines  = explode( "\n", $body );

		foreach ( $lines as $line ) {
			$line = trim( $line );
			// Skip empty lines and comments.
			if ( empty( $line ) || '#' === $line[0] ) {
				continue;
			}
			// Basic CIDR format validation.
			if ( strpos( $line, '/' ) !== false ) {
				$ranges[] = $line;
			}
		}

		return $ranges;
	}

	/**
	 * Get the cached dynamic ranges (for admin display).
	 *
	 * @since 2.8.0
	 * @return array|false Cached ranges or false if not fetched yet.
	 */
	public function get_dynamic_ranges() {
		return get_transient( self::DYNAMIC_RANGES_TRANSIENT );
	}
}
