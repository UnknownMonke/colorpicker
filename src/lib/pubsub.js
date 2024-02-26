/**
 * Publish-Subscribe Pattern class.
 * 
 * Publishers categorize messages into classes that are received by subscribers.
 * Subscribers express interest in one or more classes and only receive messages that are of interest.
 * 
 * 
 * **Properties** : 
 * 
 * - `events` : the event message object.
 * 
 * The event object properties are classes of messages, to which subscribers listen to.
 * Each class contains one or more callbacks lambda functions, which are executed when publishing events of this class.
 * 
 * Therefore, several subscribers can subscribe to the same event with a different callback.
 * 
 * 
 * **Specifics** :
 * 
 * - A subscriber can subscribe to multiple events at once, but with the same callback.
 * - An event can have multiple callbacks registered.
 */
class PubSub {

    constructor() {
        this.events = {};
    }

    /**
     * Subscribes to an event by attaching a callback to one or more events.
     * 
     * If the event does not exists as a property of the `events` object, it is created and the callback array is instantiated.
     * 
     * When the `publish` event fires, it will take two arguments :
     * 
     * - The event name.
     * - Any data that will be passed to **every single callback** registered in subscribers[eventName].
     * 
     * ---
     * 
     * @param {string} events An array of event object property names.
     * @param {function} callback Callback to be executed when publishing.
     */
    subscribe(events, callback) {
        const self = this;

        if (events.length > 0) {

            events.forEach(event => {
                if (!self.events.hasOwnProperty(event)) { // If the event is not already part of the object.
                    self.events[event] = []; // Init.
                }
                self.events[event].push(callback); // Pushes callback to the specified event. 
            });
        }        
    }

    /**
     * Publishes an event by executing all callbacks with parameters.
     * 
     * ---
     * 
     * @param {string} event Event object property name.
     * @param {function} data Params of the callbacks to be executed.
     */
    publish(event, data = {}) {
        const self = this;

        if (!self.events.hasOwnProperty(event)) {
            return;
        }
        return self.events[event].map(callback => callback(data));
    }
}