export interface RenderCVSchema {
  cv: {
    name: string;
    location?: string;
    email?: string;
    phone?: string;
    website?: string;
    social_networks?: Array<{ network: string; username: string }>;
    sections?: Record<string, any[]>;
  };
  design?: {
    theme?: string;
    [key: string]: any;
  };
}

export type ViewMode = 'editor' | 'preview';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
