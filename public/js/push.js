
//To check push notification support
function isPushNotification(reg) {
    reg.pushManager.getSubscription()
    .then((subscription) => {
      console.log('Push Notification Status: ', subscription);
      //If already access granted, change status
      if (subscription) {
        return
      }
      else {
         subscribe()
      }
    })
    .catch((error) => {
      console.error(error);
    });
  }


//To subscript push notification
function subscribe() {
    navigator.serviceWorker.ready
    .then((registration) => {
      if (!registration.pushManager) {
        alert('Your browser doesn\'t support push notifications');
        return;
      }
  
     return registration.pushManager.subscribe({
        userVisibleOnly: true, //To always show notification when received
        applicationServerKey: determineAppServerKey()

      })
      .then((subscription) => {
        console.log('Successfully subscribed: ', subscription);
        var rawKey = subscription.getKey ? subscription.getKey('p256dh') : '';
        var key = rawKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey))) : '';
        var rawAuthSecret = subscription.getKey ? subscription.getKey('auth') : '';
        var authSecret = rawAuthSecret ?
          btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret))) : '';

        var endpoint = subscription.endpoint;
  

        console.log('Successfully key', key);
        console.log('Successfully authSecret' , authSecret); 
        console.log('Successfully endpoint',endpoint);

        return fetch('/register', {
          method: 'post',
          headers: new Headers({
            'content-type': 'application/json'
          }),
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            key: key,
            authSecret: authSecret,
          }),
        })

      })
      .catch((error) => {
        console.error(error);
      })
    })
}


 


  // We need to convert the VAPID key to a base64 string when we subscribe
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function determineAppServerKey() {
    var vapidPublicKey = 'BAyb_WgaR0L0pODaR7wWkxJi__tWbM1MPBymyRDFEGjtDCWeRYS9EF7yGoCHLdHJi6hikYdg4MuYaK0XoD0qnoY';
    return urlBase64ToUint8Array(vapidPublicKey);
  }


function unsubscribe() {
    navigator.serviceWorker.ready
    .then((registration) => {
      registration.pushManager.getSubscription()
      .then((subscription) => {
  
                 var rawKey = subscription.getKey ? subscription.getKey('p256dh') : '';
                    key = rawKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey))) : '';
                    var rawAuthSecret = subscription.getKey ? subscription.getKey('auth') : '';
                    authSecret = rawAuthSecret ?
                      btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret))) : '';
  
                    endpoint = subscription.endpoint;
                    console.log('Successfully key', key);
                    console.log('Successfully authSecret' , authSecret); 
                    console.log('Successfully endpoint',endpoint);
        //If not push subscription, then return
        if(!subscription) {
          console.error('Unable to unregister from push notification');
          return;
        }
  
        //Unsubscribe
        subscription.unsubscribe()
          .then(() => {
            console.log('Successfully unsubscribed');
          })
          .catch((error) => {
            console.error(error);
          });
      })
      .catch((error) => {
        console.error('Failed to unsubscribe push notification');
      });
    })
  }