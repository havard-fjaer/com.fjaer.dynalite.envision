'use strict';

import Homey from 'homey';

module.exports = class DynaliteLightsApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Dynalite Lights has been initialized');
  }

}
