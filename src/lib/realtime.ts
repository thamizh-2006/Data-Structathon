import { supabasePublic } from './supabase';

type EventCallback = (data: any) => void;

class RealtimeEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  subscribe(channel: string, callback: EventCallback): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    // If Supabase is connected, also listen on Supabase channel
    let supabaseSubscription: any = null;
    if (supabasePublic) {
      const sbChannel = supabasePublic.channel(channel);
      sbChannel
        .on('broadcast', { event: 'update' }, (payload) => {
          callback(payload.payload);
        })
        .subscribe();
      supabaseSubscription = sbChannel;
    }

    return () => {
      this.listeners.get(channel)?.delete(callback);
      if (supabaseSubscription && supabasePublic) {
        supabasePublic.removeChannel(supabaseSubscription);
      }
    };
  }

  emit(channel: string, data: any): void {
    // Notify local listeners
    this.listeners.get(channel)?.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error('Error in event bus callback', err);
      }
    });

    // Broadcast on Supabase channel if configured
    if (supabasePublic) {
      const sbChannel = supabasePublic.channel(channel);
      sbChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          sbChannel.send({
            type: 'broadcast',
            event: 'update',
            payload: data,
          });
        }
      });
    }
  }
}

// Global singleton
const globalRef = global as unknown as { __ds_event_bus?: RealtimeEventBus };
export const eventBus = globalRef.__ds_event_bus || new RealtimeEventBus();
if (process.env.NODE_ENV !== 'production') {
  globalRef.__ds_event_bus = eventBus;
}
