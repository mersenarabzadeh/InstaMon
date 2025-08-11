export type ApiTopItem = {
  handle: string;
  permalink: string;
  caption: string;
  taken_at: string | Date;
  likes: number;
  comments: number;
  interactions: number;
  og_image_url: string;
};

export type ApiTrendingItem = {
  handle: string;
  permalink: string;
  taken_at: string | Date;
  interactions: number;
  minutes_since_publish: number;
  velocity: number;
  velocity_ratio: number;
  og_image_url: string;
};