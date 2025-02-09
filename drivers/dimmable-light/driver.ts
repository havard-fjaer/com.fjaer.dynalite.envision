import { randomUUID } from 'crypto';
import Homey from 'homey';

module.exports = class DimmableLightDriver extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Dimmable Light Driver has been initialized');
  }

  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    return [
      {
        name: 'Dynalite Dimmable Light',
        data: {
          id: 'dynalite-dimmable-light-' + randomUUID(),
        }
      },
    ];
  }

};
