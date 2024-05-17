import PubSub from './pubsub';

/**
 * Central object of the application for state management.
 * 
 * Contains :
 * 
 * - The `state` object - State of the application, contains application related variables.
 * - **Mutations** - Operation that changes a part of the state.
 * - **Actions** - Operations that triggers a mutation of the state.
 * 
 * 
 * Specifics :
 * 
 * - An action is always named, and triggers a mutation for ideally the same name.
 * - The mutation updates the state **in place**, one property at a time.
 * - In order to notify parts of the application that listen to a change in the state, each mutation *publishes an event in its name*.
 * 
 * Actions & mutations functions can be defined beforehand in a specific file, and passed as parameter of the contructor,
 * as well as the initial value of the state.
 */
export default class Store {

    constructor(params) {
        const self = this;

        self.actions = {};
        self.mutations = {};
        self.state = {};
        self.status = 'resting';
        
        self.events = new PubSub(); // Store publish-subscribe events.

        // Actions & mutations functions can be defined prior of the instantiation of the store and passed as contructor parameters.
        if (params.hasOwnProperty('actions')) {
            self.actions = params.actions;
        }
        if (params.hasOwnProperty('mutations')) {
            self.mutations = params.mutations;
        }

        // The state is encapsulated into a Proxy to be able to preprocess and track changes.
        self.state = new Proxy( (params.state || {}), {

            set: function(state, key, value) { // Built in trap pattern to the Object.set() method.
                state[key] = value;
            
                // console.info(`state-change: ${key}: ${value}`);
            
                // Can be used as a single entry-point publish, where a type is defined with a switch on it, then a specific publish happens.
                // self.events.publish('state-change', self.state);
            
                // Catches forced manual mutations (explicit update of the state attribute : state.myVariable = ...) outside of the mutation function.
                if (self.status !== 'mutation') {
                    console.warn(`You should use a mutation to set ${key}`);
                }
                self.status = 'resting';
                return true;
            }
        });
    }

    /**
     * Dispatches an action, which executes and triggers a mutation of the state.
     * 
     * ---
     * 
     * @param {string} actionKey The action object property name, referencing the action function.
     * @param {function} payload State update data.
     */
    dispatch(actionKey, payload) {
        const self = this;
        
        // Type check : the action function exists.
        if (typeof self.actions[actionKey] !== 'function') {
            console.error(`Action "${actionKey} doesn't exist.`);
            return false;
        }
        // Anything that is logged after (mutation, Proxy log) will be kept in the group.
        // console.groupCollapsed(`ACTION: ${actionKey}`);
      
        self.status = 'action';

        // Executes the action which will trigger a commit;
        self.actions[actionKey](self, payload);
      
        // console.groupEnd();
        return true;
    }

    /**
     * Commits a mutation into the state.
     * 
     * ---
     * 
     * @param {string} mutationKey The mutation object property name, referencing the mutation function.
     * @param {function} payload State update data.
     */
    commit(mutationKey, payload) {
        const self = this;
      
        // Type check : the mutation function exists.
        if (typeof self.mutations[mutationKey] !== 'function') {
            console.error(`Mutation "${mutationKey}" doesn't exist`);
            return false;
        }
      
        self.status = 'mutation';
      
        self.mutations[mutationKey](self.state, payload);

        // Notifies listeners.
        self.events.publish(mutationKey);
      
        // Used for pure state update.
        //self.state = Object.assign(self.state, newState);
      
        return true;
    }
}