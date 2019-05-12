import Worker from './voxels.worker';
import WorkerService from './service';

class Voxels extends WorkerService {
  constructor() {
    super({ Worker });
  }

  generate({ map, size }) {
    return this.request({
      buffers: [map.buffer],
      payload: { map, size },
    });
  }
}

export default Voxels;
