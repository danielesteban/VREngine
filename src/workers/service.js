class WorkerService {
  constructor({
    Worker,
    concurrency = (navigator.hardwareConcurrency || 1),
  }) {
    this.concurrency = concurrency;
    this.promiseId = 0;
    this.promises = {};
    this.queue = [];
    this.workers = [...Array(concurrency)].map(() => {
      const worker = new Worker();
      worker.isBusy = false;
      worker.onmessage = ({ data: { id, ...payload } }) => (
        this.onMessage({
          id,
          payload,
          worker,
        })
      );
      return worker;
    });
  }

  onMessage({
    id,
    payload,
    worker,
  }) {
    const { promises, queue } = this;
    if (promises[id]) {
      promises[id](payload);
      delete promises[id];
    }
    if (queue.length) {
      this.send({ ...queue.shift(), worker });
    } else {
      worker.isBusy = false;
    }
  }

  request({
    buffers,
    payload,
  }) {
    return new Promise((promise) => {
      const { queue, workers } = this;
      let worker;
      for (let i = 0; i < workers.length; i += 1) {
        if (!workers[i].isBusy) {
          worker = workers[i];
          break;
        }
      }
      if (!worker) {
        queue.push({ buffers, payload, promise });
        return;
      }
      this.send({
        buffers,
        payload,
        promise,
        worker,
      });
    });
  }

  send({
    buffers,
    payload,
    promise,
    worker,
  }) {
    const { promiseId: id, promises } = this;
    this.promiseId += 1;
    promises[id] = promise;
    worker.isBusy = true;
    worker.postMessage({
      id,
      ...payload,
    }, buffers);
  }
}

export default WorkerService;
