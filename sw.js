self.addEventListener("push", (event) => {
  let data = { title: "OmniPickle", body: "Time to train!" };
  try { data = event.data.json(); } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title || "OmniPickle", {
      body: data.body || "Time to train!",
      icon: "logo.jpeg",
      badge: "logo.jpeg",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/home.html"));
});