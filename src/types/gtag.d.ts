interface GtagEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  page_path?: string;
  [key: string]: string | number | boolean | undefined;
}

interface Window {
  gtag: (
    command: 'config' | 'event' | 'js' | 'set',
    targetId: string | Date,
    params?: GtagEventParams
  ) => void;
  dataLayer: Array<unknown>;
}
