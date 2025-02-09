
import DynaliteDevice from '../DynaliteDevice';

export default class DynaliteDimmableLight extends DynaliteDevice {
  
  async onInit() {
    super.onInit()
    this.registerCapabilityListener("dim", this.onCapabilityDim.bind(this));
  }
  
  async onCapabilityDim(value: number) {
    this.startDimmingProcess();
    await this.setLightLevel(value);
  }


  private dimmingTimer: NodeJS.Timeout | null = null;

    // Inform on/off capability that we are starting a dimming process
    startDimmingProcess() {
    this.dimmingInProgress = true;
    if (this.dimmingTimer) clearTimeout(this.dimmingTimer);

    // Assume that there will be a delay between turning on the light and starting dimming
    this.dimmingTimer = setTimeout(() => {
      this.dimmingInProgress = false;
      this.dimmingTimer = null;
    }, this.assumedDelayBetweenTurnOnAndDimming);
  }

  
}

module.exports = DynaliteDimmableLight;