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

            // Fallback: Share as "Background" image.
            // This is the most reliable way to open the Story Editor with an image.
            // It might cover the whole screen, but it works.
            intent.setDataAndType(contentUri, "image/png");
            intent.setPackage("com.instagram.android");

            // Explicitly grant permission because this is an extra, not the main data
            intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getContext().grantUriPermission(
                    "com.instagram.android",
                    contentUri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION);

            // Authentication / Attribution Link (Try Geogram)
            String attributionLink = call.getString("attributionLink");
            if (attributionLink != null && !attributionLink.isEmpty()) {
                intent.putExtra("content_url", attributionLink);
                // Try alternate key sometimes used for stickers/interaction
                intent.putExtra("com.instagram.sharedSticker.contentURL", attributionLink);
            }

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
            intent.setType("image/png"); // Specific type
            intent.putExtra(Intent.EXTRA_STREAM, contentUri);
            intent.putExtra(Intent.EXTRA_TEXT, "Check out this snapshot from Geogram!");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            // Check for standard WhatsApp
            intent.setPackage("com.whatsapp");
            if (getContext().getPackageManager().resolveActivity(intent, 0) != null) {
                getActivity().startActivityForResult(intent, 0);
                call.resolve();
                return;
            }

            // Fallback: Check for WhatsApp Business
            intent.setPackage("com.whatsapp.w4b");
            if (getContext().getPackageManager().resolveActivity(intent, 0) != null) {
                getActivity().startActivityForResult(intent, 0);
                call.resolve();
                return;
            }

            // If neither found, fail (frontend will handle generic fallback)
            Log.w("InstagramStories", "WhatsApp not found (Standard or Business)");
            call.reject("WhatsApp is not installed");

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
