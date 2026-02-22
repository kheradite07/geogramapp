import Foundation
import Capacitor
import UIKit

@objc(InstagramStoriesPlugin)
public class InstagramStoriesPlugin: CAPPlugin {
    
    // Retain the document controller so it doesn't get deallocated instantly
    var documentController: UIDocumentInteractionController?

    @objc func shareToStory(_ call: CAPPluginCall) {
        guard let base64String = call.getString("base64") else {
            call.reject("No base64 data provided")
            return
        }

        let cleanBase64 = base64String.components(separatedBy: ",").last ?? base64String
        // Add ignoreUnknownCharacters to prevent line-break failures
        guard let imageData = Data(base64Encoded: cleanBase64, options: .ignoreUnknownCharacters) else {
            call.reject("Invalid base64 image data")
            return
        }

        let urlScheme = URL(string: "instagram-stories://share")!

        DispatchQueue.main.async {
            if UIApplication.shared.canOpenURL(urlScheme) {
                var pasteboardItems: [String: Any] = [
                    "com.instagram.sharedSticker.backgroundImage": imageData,
                    "com.instagram.sharedSticker.appID": "962534345263628"
                ]

                if let attributionLink = call.getString("attributionLink") {
                    pasteboardItems["com.instagram.sharedSticker.contentURL"] = attributionLink
                }

                let pasteboardOptions = [UIPasteboard.OptionsKey.expirationDate: Date().addingTimeInterval(60 * 5)]
                UIPasteboard.general.setItems([pasteboardItems], options: pasteboardOptions)

                UIApplication.shared.open(urlScheme, options: [:]) { success in
                    if success {
                        call.resolve()
                    } else {
                        call.reject("Failed to open Instagram")
                    }
                }
            } else {
                call.reject("Instagram is not installed or LSApplicationQueriesSchemes is missing.")
            }
        }
    }

    @objc func shareToWhatsApp(_ call: CAPPluginCall) {
        guard let base64String = call.getString("base64") else {
            call.reject("No base64 data provided")
            return
        }

        let cleanBase64 = base64String.components(separatedBy: ",").last ?? base64String
        guard let imageData = Data(base64Encoded: cleanBase64, options: .ignoreUnknownCharacters) else {
            call.reject("Invalid base64 image data")
            return
        }

        let whatsappURL = URL(string: "whatsapp://app")!

        DispatchQueue.main.async {
            if UIApplication.shared.canOpenURL(whatsappURL) {
                let tempDir = FileManager.default.temporaryDirectory
                let fileURL = tempDir.appendingPathComponent("whatsapp_share.png")

                do {
                    try imageData.write(to: fileURL)

                    self.documentController = UIDocumentInteractionController(url: fileURL)
                    self.documentController?.uti = "public.png"

                    if let vc = self.bridge?.viewController {
                        let presented = self.documentController?.presentOpenInMenu(from: vc.view.bounds, in: vc.view, animated: true) ?? false
                        if presented {
                            call.resolve()
                        } else {
                            call.reject("Could not present WhatsApp document interaction controller")
                        }
                    } else {
                        call.reject("No View Controller found to present from")
                    }
                } catch {
                    call.reject("Failed to save image for WhatsApp: \(error.localizedDescription)")
                }
            } else {
                 call.reject("WhatsApp is not installed or LSApplicationQueriesSchemes is missing.")
            }
        }
    }
}
