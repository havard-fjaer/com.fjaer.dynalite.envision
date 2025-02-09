import Homey from 'homey';
import { StatusChecker } from './StatusChecker';

export default class DynaliteDevice extends Homey.Device {

  statusChecker = new StatusChecker(this);

  async onInit() {
    this.log(`${this.constructor.name} has been initialized`);
    this.registerCapabilityListener("onoff", this.onCapabilityOnoff.bind(this));
    this.statusChecker.start();
  }



  async onCapabilityOnoff(value: boolean) {
    if (value === false) {
      await this.setLightLevel(0);
      return;
    }
    // If there is a dimming process in progress, skip turning on the light
    let level = await this.awaitDimming();
    if (level === null) {
      this.log("Skipping turn on due to dimming state.");
      return;
    }

    await this.setLightLevel(level);
  }

  // Override to evaluate if light should be turned on or not. Set level to 1 to turn on the light, otherwise set to null.
  protected async awaitDimming(): Promise<number | null> {
    return 1;
  }


  async setLightLevel(level: number) {
    const settings = this.getSettings();
    this.checkSettings(settings);
    let dynaliteDimLevel = Math.round(level * 100);

    let url = `http://${settings.host}/SetDyNet.cgi?a=${settings.area}&c=${settings.channel}&f=${settings.fade}&l=${dynaliteDimLevel}&_=${Date.now()}`;
    this.log(`Calling ${url}`);

    await fetch(url).catch(this.error);

    this.setCapabilityValue("onoff", level > 0);
    // this.updateCapability(level);
  }

  // protected updateCapability(level: number): void {
  // }


  async checkSettings(settings: any) {
    let errors = [];
    if (!settings.host) errors.push('No host configured');
    if (!settings.area) errors.push('No area configured');
    if (!settings.channel) errors.push('No channel configured');
    if (!settings.fade) errors.push('No fade configured');

    if (errors.length > 0) {
      this.error(errors.join(', '));
      throw new Error(errors.join(', '));
    }
  }

  async onAdded() {
    this.log('Dynalite Device added');
  }

  async onSettings({ changedKeys }: { changedKeys: string[] }) {
    this.log(`Settings changed: ${changedKeys.join(', ')}`);
  }

  async onRenamed(name: string) {
    this.log(`Dynalite Device renamed to ${name}`);
  }

  async onDeleted() {
    this.log('Dynalite Device deleted');
  }
}

