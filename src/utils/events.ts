
type Listener<TEvent> = (e:TEvent) => void;

export class EventSource {
    _eventListeners: Map<string, Set<Listener<any>>> = new Map();
    constructor(eventNames : string[]) {
        for (var eventName of eventNames) {
            this._eventListeners.set(eventName, new Set());
        }
    }

    addEventListener<T>(eventName: string, listener : Listener<T>) : void {
        this._getListenerSet(eventName).add(listener);
    }

    removeEventListener<T>(eventName: string, listener : Listener<T>) : void {
        this._getListenerSet(eventName).delete(listener);
    }

    fireEvent<T>(eventName: string, eventParam? : T) : void {
        this._getListenerSet(eventName).forEach(listener => {
            listener(eventParam);
        });
    }

    _getListenerSet(eventName : string) : Set<Listener<any>> {
        const listenerSet = this._eventListeners.get(eventName);
        if (!listenerSet) {
            throw new Error("EventSource does not support event: " + eventName);
        }
        return listenerSet;
    }
}