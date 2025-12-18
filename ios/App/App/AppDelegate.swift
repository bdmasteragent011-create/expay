import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Enable screen protection to prevent screenshots and recording
        ScreenProtection.shared.enableScreenProtection(in: window)
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Hide content when app goes to background (prevents screenshot in app switcher)
        let blurEffect = UIBlurEffect(style: .dark)
        let blurView = UIVisualEffectView(effect: blurEffect)
        blurView.frame = window?.bounds ?? UIScreen.main.bounds
        blurView.tag = 1234
        window?.addSubview(blurView)
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Remove blur when app becomes active again
        window?.viewWithTag(1234)?.removeFromSuperview()
        
        // Re-enable screen protection
        ScreenProtection.shared.enableScreenProtection(in: window)
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
