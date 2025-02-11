
import DynaliteDevice from '../DynaliteDevice';

// Extends on-off devices to also support dimming.
export default class DynaliteDimmableLight extends DynaliteDevice {

  // Light status be polled every 60 seconds, with a random initial delay, to avoid overloading the gateway.
  waitBeforeCheckLightStatus = 120; // Seconds

  // Homey Moods will turn on the light first, and then start dimming. 
  // We do not want to turn on the light if dimming is in progress, as turning on is the same as setting dim to 100%.
  // These variables control the timing, asking the onoff capability to wait and see 
  // if dimming is in progress, and then turn on the light if no dimming occurs within the time frame.
  waitBeforeTurnOnLight = 200;  // ms 
  
  // This value must be higher than waitBeforeTurnOnLight
  assumedDelayBetweenTurnOnAndDimming = 500; // ms

  async onInit() {
    super.onInit()
    this.registerCapabilityListener("dim", this.onCapabilityDim.bind(this));
  }

  async onCapabilityDim(value: number) {
    this.startDimmingProcess();
    await this.setLightLevel(value);
  }
  private dimmingInProgress = false;


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

  protected async awaitDimming(): Promise<number | null> {
    // Wait and see if any dimming command comes in
    await new Promise(resolve => setTimeout(resolve, this.waitBeforeTurnOnLight));

    // If dimming is in progress, skip turning on the light by returning null
    if (this.dimmingInProgress) {
      this.log('Dimming is still in progress, skipping turn on');
      return null;
    }

    // If no dimming command comes in, turn on the light by specifying dim to be 100%
    return this.getCapabilityValue("dim") || 1;
  }

}

module.exports = DynaliteDimmableLight;