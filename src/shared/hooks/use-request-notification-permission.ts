import { useEffect } from 'react';
import { useAuth } from '@/shared/hooks/use-auth';

export function useRequestNotificationPermission() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Only request permission on first login when user is authenticated
    if (!isAuthenticated) return;

    const requestPermission = async () => {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
      }

      // Request permission if not already granted
      if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
            console.log('✅ Notifications enabled');
            
            // Register service worker
            if ('serviceWorker' in navigator) {
              try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                  scope: '/'
                });
                console.log('✅ Service Worker registered:', registration.scope);
                
                // Here you would typically subscribe to push notifications
                // and send the subscription to your backend
                // For OneSignal integration, this is handled by their SDK
              } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
              }
            }
          } else if (permission === 'denied') {
            console.log('❌ Notifications denied by user');
          }
        } catch (error) {
          console.error('❌ Error requesting notification permission:', error);
        }
      } else if (Notification.permission === 'granted') {
        console.log('✅ Notifications already enabled');
        
        // Register service worker if not already done
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then((registration) => {
            if (!registration) {
              navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('✅ Service Worker registered:', reg.scope))
                .catch(err => console.error('❌ Service Worker registration failed:', err));
            }
          });
        }
      }
    };

    // Delay slightly to not interrupt initial page load
    const timer = setTimeout(requestPermission, 2000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);
}
