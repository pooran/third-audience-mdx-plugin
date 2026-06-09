<?php
/**
 * Cache Guide Modal Component.
 *
 * @package ThirdAudience
 * @since   3.3.1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<!-- Cache Guide Modal -->
<div class="ta-cache-modal-overlay" style="display: none;">
	<div class="ta-cache-modal">
		<div class="ta-cache-modal-header">
			<h2><?php esc_html_e( 'Cache Status Guide', 'third-audience' ); ?></h2>
			<button type="button" class="ta-cache-modal-close">
				<span class="dashicons dashicons-no-alt"></span>
			</button>
		</div>
		<div class="ta-cache-modal-body">
			<div class="ta-cache-guide-grid">
				<div class="ta-cache-guide-item">
					<span class="ta-cache-badge ta-cache-pre_generated">⚡ Instant</span>
					<h4><?php esc_html_e( 'PRE_GENERATED', 'third-audience' ); ?></h4>
					<p><?php esc_html_e( 'Served from post meta (<1ms). Fastest possible. Permanent — set when you run Generate All. Never expires.', 'third-audience' ); ?></p>
				</div>
				<div class="ta-cache-guide-item">
					<span class="ta-cache-badge ta-cache-hit">⚡ Cached</span>
					<h4><?php esc_html_e( 'HIT', 'third-audience' ); ?></h4>
					<p><?php esc_html_e( 'Served from transient cache (1–5ms). Renews automatically every 24 hours.', 'third-audience' ); ?></p>
				</div>
				<div class="ta-cache-guide-item">
					<span class="ta-cache-badge ta-cache-miss">🕐 Fresh</span>
					<h4><?php esc_html_e( 'MISS', 'third-audience' ); ?></h4>
					<p><?php esc_html_e( 'Generated fresh on this request (10–50ms). Saved to cache immediately after — next request will be a HIT.', 'third-audience' ); ?></p>
				</div>
				<div class="ta-cache-guide-item">
					<span class="ta-cache-badge ta-cache-failed">⚠ Failed</span>
					<h4><?php esc_html_e( 'FAILED', 'third-audience' ); ?></h4>
					<p><?php esc_html_e( 'Generation failed. Post may be deleted or content unavailable. Check System Health for details.', 'third-audience' ); ?></p>
				</div>
			</div>
		</div>
	</div>
</div>
