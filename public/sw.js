self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: "FutureCrest CRM",
      body: event.data ? event.data.text() : "",
    };
  }

  const title = data.title || "FutureCrest CRM";

  const options = {
    body: data.body || "",
    icon: "/logo.jpg",
    badge: "/logo.jpg",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          const clientUrl = new URL(client.url);

          if (clientUrl.pathname === url && "focus" in client) {
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
