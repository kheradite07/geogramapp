package com.geogram.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.net.http.SslError;
import android.webkit.SslErrorHandler;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Bridge;

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
        }
    }
}
