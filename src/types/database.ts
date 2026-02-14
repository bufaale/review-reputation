export interface Profile {
  [key: string]: unknown;
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  subscription_status: "active" | "trialing" | "past_due" | "canceled" | "free";
  subscription_plan: string | null;
  company_name: string | null;
  company_logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Location {
  [key: string]: unknown;
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  google_maps_url: string | null;
  industry: string | null;
  tone: "professional" | "friendly" | "casual";
  created_at: string;
}

export interface Review {
  [key: string]: unknown;
  id: string;
  user_id: string;
  location_id: string;
  source: "google" | "yelp" | "facebook" | "other";
  reviewer_name: string | null;
  rating: number;
  review_text: string;
  review_date: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  sentiment_score: number | null;
  tags: string[];
  created_at: string;
}

export interface ReviewWithResponse extends Review {
  responses: ReviewResponse[];
  location?: Location;
}

export interface ReviewResponse {
  [key: string]: unknown;
  id: string;
  review_id: string;
  content: string;
  tone: string | null;
  is_used: boolean;
  created_at: string;
}

export interface Customer {
  [key: string]: unknown;
  id: string;
  user_id: string;
  location_id: string;
  name: string;
  email: string;
  phone: string | null;
  last_request_sent: string | null;
  created_at: string;
}

export interface ReviewRequest {
  [key: string]: unknown;
  id: string;
  user_id: string;
  location_id: string;
  customer_id: string;
  channel: "email" | "sms";
  status: "sent" | "opened" | "completed";
  review_link: string | null;
  sent_at: string;
  created_at: string;
}

export interface ReviewRequestWithCustomer extends ReviewRequest {
  customer: Customer;
}

// Database type for Supabase client generics
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          [key: string]: unknown;
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: string;
          subscription_plan?: string | null;
          company_name?: string | null;
          company_logo_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          role?: string;
        };
        Update: {
          [key: string]: unknown;
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: string;
          subscription_plan?: string | null;
          company_name?: string | null;
          company_logo_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          [key: string]: unknown;
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string;
          status: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          [key: string]: unknown;
          user_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string;
          status: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
        };
        Update: {
          [key: string]: unknown;
          user_id?: string;
          stripe_subscription_id?: string;
          stripe_price_id?: string;
          status?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      locations: {
        Row: Location;
        Insert: {
          [key: string]: unknown;
          id?: string;
          user_id: string;
          name: string;
          address?: string | null;
          google_maps_url?: string | null;
          industry?: string | null;
          tone?: string;
        };
        Update: {
          [key: string]: unknown;
          name?: string;
          address?: string | null;
          google_maps_url?: string | null;
          industry?: string | null;
          tone?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: Review;
        Insert: {
          [key: string]: unknown;
          id?: string;
          user_id: string;
          location_id: string;
          source?: string;
          reviewer_name?: string | null;
          rating: number;
          review_text: string;
          review_date?: string | null;
          sentiment?: string | null;
          sentiment_score?: number | null;
          tags?: string[];
        };
        Update: {
          [key: string]: unknown;
          source?: string;
          reviewer_name?: string | null;
          rating?: number;
          review_text?: string;
          review_date?: string | null;
          sentiment?: string | null;
          sentiment_score?: number | null;
          tags?: string[];
        };
        Relationships: [];
      };
      responses: {
        Row: ReviewResponse;
        Insert: {
          [key: string]: unknown;
          id?: string;
          review_id: string;
          content: string;
          tone?: string | null;
          is_used?: boolean;
        };
        Update: {
          [key: string]: unknown;
          content?: string;
          tone?: string | null;
          is_used?: boolean;
        };
        Relationships: [];
      };
      customers: {
        Row: Customer;
        Insert: {
          [key: string]: unknown;
          id?: string;
          user_id: string;
          location_id: string;
          name: string;
          email: string;
          phone?: string | null;
          last_request_sent?: string | null;
        };
        Update: {
          [key: string]: unknown;
          name?: string;
          email?: string;
          phone?: string | null;
          last_request_sent?: string | null;
        };
        Relationships: [];
      };
      review_requests: {
        Row: ReviewRequest;
        Insert: {
          [key: string]: unknown;
          id?: string;
          user_id: string;
          location_id: string;
          customer_id: string;
          channel?: string;
          status?: string;
          review_link?: string | null;
          sent_at?: string;
        };
        Update: {
          [key: string]: unknown;
          channel?: string;
          status?: string;
          review_link?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
