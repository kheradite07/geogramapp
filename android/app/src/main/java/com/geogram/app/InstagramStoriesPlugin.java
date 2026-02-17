package com.geogram.app;

import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

@CapacitorPlugin(name = "InstagramStories")
public class InstagramStoriesPlugin extends Plugin {

    @PluginMethod
    public void shareToStory(PluginCall call) {
        String base64Data = call.getString("base64");
        String appId = "962534345263628";

        if (base64Data == null) {
            call.reject("No base64 data provided");
            return;
        }

        try {
            File newFile = saveBase64ToFile(base64Data, "story_share.png");
            Uri contentUri = FileProvider.getUriForFile(getContext(), "com.geogram.app.fileprovider", newFile);

            Intent intent = new Intent("com.instagram.share.ADD_TO_STORY");
            // CRITICAL FIX: Do NOT set data (setDataAndType). Only set Type.
            // This prevents Instagram from treating it as a "background" image + sticker.
            intent.setType("image/png");
            intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.setPackage("com.instagram.android");

            // Sticker Image
            intent.putExtra("interactive_asset_uri", contentUri);

            // Solid Brand Background
            intent.putExtra("top_background_color", "#1a0033");
            intent.putExtra("bottom_background_color", "#1a0033");

            intent.putExtra("source_application", appId);

            if (getContext().getPackageManager().resolveActivity(intent, 0) != null) {
                getActivity().startActivityForResult(intent, 0);
                call.resolve();
            } else {
                call.reject("Instagram is not installed");
            }

        } catch (Exception e) {
            Log.e("InstagramStories", "Error sharing", e);
            call.reject("Error sharing: " + e.getMessage());
        }
    }

    @PluginMethod
    public void shareToWhatsApp(PluginCall call) {
        String base64Data = call.getString("base64");

        if (base64Data == null) {
            call.reject("No base64 data provided");
            return;
        }

        try {
            File newFile = saveBase64ToFile(base64Data, "whatsapp_share.png");
            Uri contentUri = FileProvider.getUriForFile(getContext(), "com.geogram.app.fileprovider", newFile);

            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType("image/png");
            intent.setPackage("com.whatsapp");
            intent.putExtra(Intent.EXTRA_STREAM, contentUri);
            intent.putExtra(Intent.EXTRA_TEXT, "Check out this snapshot from Geogram!");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            if (getContext().getPackageManager().resolveActivity(intent, 0) != null) {
                getActivity().startActivityForResult(intent, 0);
                call.resolve();
            } else {
                call.reject("WhatsApp is not installed");
            }
        } catch (Exception e) {
            Log.e("InstagramStories", "Error sharing to WhatsApp", e);
            call.reject("Error sharing to WhatsApp: " + e.getMessage());
        }
    }

    private File saveBase64ToFile(String base64Data, String fileName) throws IOException {
        File cachePath = new File(getContext().getCacheDir(), "images");
        cachePath.mkdirs();
        File newFile = new File(cachePath, fileName);

        if (base64Data.contains(",")) {
            base64Data = base64Data.split(",")[1];
        }

        byte[] decodedString = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT);
        FileOutputStream fo = new FileOutputStream(newFile);
        fo.write(decodedString);
        fo.flush();
        fo.close();
        return newFile;
    }
}
