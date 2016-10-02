
type Listener<TEvent> = (e:TEvent) => void;

export class EventSource {
    _eventListeners: Map<string, Set<Listener>> = new Map();
    constructor(eventNames : string[]) {
        for (var eventName of eventNames) {
            this._eventListeners.set(eventName, new Set());
        }
    }

    addEventListener(eventName: string, listener : Listener) : void {
        this._getListenerSet(eventName).add(listener);
    }

    removeEventListener(eventName: string, listener : Listener) : void {
        this._getListenerSet(eventName).delete(listener);
    }

    fireEvent(eventName: string, eventParam? : any) : void {
        this._getListenerSet(eventName).forEach(listener => {
            listener(eventParam);
        });
    }

    _getListenerSet(eventName : string) : Set<Listener> {
        const listenerSet = this._eventListeners.get(eventName);
        if (!listenerSet) {
            throw new Error("EventSource does not support event: " + eventName);
        }
        return listenerSet;
    }
}