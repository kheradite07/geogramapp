package com.geogram.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.net.http.SslError;
import android.webkit.SslErrorHandler;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Bridge;
import android.view.View;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(InstagramStoriesPlugin.class);
        super.onCreate(savedInstanceState);

        // DEV HACK: Bypass SSL Verification for Localhost
        Bridge bridge = getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().setWebViewClient(new WebViewClient() {
                @Override
                public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                    handler.proceed(); // Ignore SSL certificate errors
                }
            });

            // --- PHASE 3 ANDROID WEBVIEW OPTIMIZATION ---
            // Force hardware acceleration layer for Mapbox WebGL canvas performance
            // Some devices (e.g., Samsung A series) may ignore the manifest
            // hardwareAccelerated flag for WebViews
            bridge.getWebView().setLayerType(View.LAYER_TYPE_HARDWARE, null);
        }
    }
}
