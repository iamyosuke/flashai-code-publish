async function initMocks() {
  if (typeof window === "undefined") {
    const { server } = await import("./server");
    console.log("initMocks: server");
    server.listen();
  } else {
    const { worker } = await import("./browser");
    console.log("initMocks: worker");
    worker.start();
  }
}

export { initMocks };
