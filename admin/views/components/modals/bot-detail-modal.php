<?php
/**
 * Bot Detail Modal Component.
 *
 * Shown when a row in "Bot Activity Distribution" is clicked.
 *
 * @package ThirdAudience
 * @since   3.5.5
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<!-- Bot Detail Modal -->
<div class="ta-bot-detail-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 100000; align-items: center; justify-content: center; overflow-y: auto;">
	<div class="ta-session-modal" style="max-width: 900px;">
		<div class="ta-session-modal-header">
			<h2 id="ta-bot-detail-title"><?php esc_html_e( 'Bot Activity Breakdown', 'third-audience' ); ?></h2>
			<button type="button" class="ta-bot-detail-close">
				<span class="dashicons dashicons-no-alt"></span>
			</button>
		</div>
		<div class="ta-session-modal-body">
			<!-- Loading state -->
			<div class="ta-bot-detail-loading" style="text-align: center; padding: 40px;">
				<span class="spinner is-active" style="float: none;"></span>
				<p><?php esc_html_e( 'Loading data...', 'third-audience' ); ?></p>
			</div>

			<!-- Content (hidden until data loads) -->
			<div class="ta-bot-detail-content" style="display: none;">

				<!-- 3 Hero Stats -->
				<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
					<div class="ta-session-stat">
						<span class="ta-stat-value" id="ta-bot-detail-stat1">—</span>
						<span class="ta-stat-label"><?php esc_html_e( 'Total Visits', 'third-audience' ); ?></span>
					</div>
					<div class="ta-session-stat">
						<span class="ta-stat-value" id="ta-bot-detail-stat2">—</span>
						<span class="ta-stat-label"><?php esc_html_e( 'Unique Pages', 'third-audience' ); ?></span>
					</div>
					<div class="ta-session-stat">
						<span class="ta-stat-value" id="ta-bot-detail-stat3">—</span>
						<span class="ta-stat-label"><?php esc_html_e( 'Cache Hit Rate', 'third-audience' ); ?></span>
					</div>
				</div>

				<!-- Chart + Countries side by side -->
				<div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; margin-bottom: 20px;">

					<!-- Top Pages Doughnut -->
					<div>
						<h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: #1d2327;">
							<span class="dashicons dashicons-chart-pie" style="color: #007aff; font-size: 15px; width: 15px; height: 15px; margin-right: 4px;"></span>
							<?php esc_html_e( 'Top Pages Crawled', 'third-audience' ); ?>
						</h4>
						<div style="display: flex; gap: 16px; align-items: flex-start;">
							<div style="flex: 0 0 150px;">
								<canvas id="ta-bot-detail-chart" height="150"></canvas>
							</div>
							<div id="ta-bot-detail-legend" style="flex: 1; font-size: 12px; line-height: 1.5; overflow-y: auto; max-height: 160px;"></div>
						</div>
					</div>

					<!-- Countries + Activity -->
					<div>
						<h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #1d2327;">
							<span class="dashicons dashicons-admin-site" style="color: #34c759; font-size: 15px; width: 15px; height: 15px; margin-right: 4px;"></span>
							<?php esc_html_e( 'Top Countries', 'third-audience' ); ?>
						</h4>
						<div id="ta-bot-detail-countries" style="font-size: 12px; max-height: 100px; overflow-y: auto;"></div>

						<div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #e5e5ea;">
							<h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #1d2327;">
								<span class="dashicons dashicons-clock" style="color: #ff9500; font-size: 15px; width: 15px; height: 15px; margin-right: 4px;"></span>
								<?php esc_html_e( 'Activity', 'third-audience' ); ?>
							</h4>
							<div id="ta-bot-detail-activity" style="font-size: 12px; color: #3c434a; line-height: 2;"></div>
						</div>
					</div>
				</div>

				<!-- Response Time Distribution -->
				<div>
					<h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #1d2327;">
						<span class="dashicons dashicons-performance" style="color: #af52de; font-size: 15px; width: 15px; height: 15px; margin-right: 4px;"></span>
						<?php esc_html_e( 'Response Time Distribution', 'third-audience' ); ?>
					</h4>
					<div id="ta-bot-detail-response" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;"></div>
				</div>

			</div><!-- .ta-bot-detail-content -->
		</div><!-- .ta-session-modal-body -->
	</div><!-- .ta-session-modal -->
</div><!-- .ta-bot-detail-overlay -->
