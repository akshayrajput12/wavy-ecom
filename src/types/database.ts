/**
 * Supabase Database types for supabase/migrations (public schema).
 * Hand-maintained to match the migrations until a local stack is available; regenerate with
 * `npm run db:types` (local stack) or `supabase gen types typescript --project-id <ref>`.
 * Contract + RPC docs: docs/database/SCHEMA.md.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string | null;
          name: string;
          phone: string;
          line1: string;
          line2: string | null;
          landmark: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string | null;
          name: string;
          phone: string;
          line1: string;
          line2?: string | null;
          landmark?: string | null;
          city: string;
          state: string;
          postal_code: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string | null;
          name?: string;
          phone?: string;
          line1?: string;
          line2?: string | null;
          landmark?: string | null;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "addresses_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      analytics_events: {
        Row: {
          id: string;
          created_at: string;
          event_name: Database["public"]["Enums"]["analytics_event_name"];
          visitor_session_id: string | null;
          anonymous_id: string | null;
          user_id: string | null;
          path: string | null;
          page_type: string | null;
          referrer: string | null;
          product_id: string | null;
          variant_id: string | null;
          order_id: string | null;
          properties: Json;
          source: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          event_name: Database["public"]["Enums"]["analytics_event_name"];
          visitor_session_id?: string | null;
          anonymous_id?: string | null;
          user_id?: string | null;
          path?: string | null;
          page_type?: string | null;
          referrer?: string | null;
          product_id?: string | null;
          variant_id?: string | null;
          order_id?: string | null;
          properties?: Json;
          source?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          event_name?: Database["public"]["Enums"]["analytics_event_name"];
          visitor_session_id?: string | null;
          anonymous_id?: string | null;
          user_id?: string | null;
          path?: string | null;
          page_type?: string | null;
          referrer?: string | null;
          product_id?: string | null;
          variant_id?: string | null;
          order_id?: string | null;
          properties?: Json;
          source?: string;
        };
        Relationships: [
        ];
      };
      attribute_values: {
        Row: {
          id: string;
          attribute_id: string;
          value: string;
          slug: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          attribute_id: string;
          value: string;
          slug: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          attribute_id?: string;
          value?: string;
          slug?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "attribute_values_attribute_id_fkey"; columns: ["attribute_id"]; isOneToOne: false; referencedRelation: "attributes"; referencedColumns: ["id"] },
        ];
      };
      attributes: {
        Row: {
          id: string;
          code: string;
          name: string;
          is_filterable: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          is_filterable?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          is_filterable?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
        ];
      };
      audit_logs: {
        Row: {
          id: number;
          actor_id: string | null;
          actor_role: string | null;
          actor_email: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          before: Json | null;
          after: Json | null;
          changed_fields: string[] | null;
          ip: string | null;
          user_agent: string | null;
          request_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          actor_id?: string | null;
          actor_role?: string | null;
          actor_email?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          before?: Json | null;
          after?: Json | null;
          changed_fields?: string[] | null;
          ip?: string | null;
          user_agent?: string | null;
          request_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          actor_id?: string | null;
          actor_role?: string | null;
          actor_email?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          before?: Json | null;
          after?: Json | null;
          changed_fields?: string[] | null;
          ip?: string | null;
          user_agent?: string | null;
          request_id?: string | null;
          created_at?: string;
        };
        Relationships: [
        ];
      };
      blog_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
        Relationships: [
        ];
      };
      blog_post_tags: {
        Row: {
          post_id: string;
          tag_id: string;
        };
        Insert: {
          post_id: string;
          tag_id: string;
        };
        Update: {
          post_id?: string;
          tag_id?: string;
        };
        Relationships: [
          { foreignKeyName: "blog_post_tags_post_id_fkey"; columns: ["post_id"]; isOneToOne: false; referencedRelation: "blog_posts"; referencedColumns: ["id"] },
          { foreignKeyName: "blog_post_tags_tag_id_fkey"; columns: ["tag_id"]; isOneToOne: false; referencedRelation: "blog_tags"; referencedColumns: ["id"] },
        ];
      };
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string;
          cover_url: string | null;
          cover_alt: string;
          body: string;
          status: Database["public"]["Enums"]["blog_status"];
          scheduled_for: string | null;
          published_at: string | null;
          author_id: string | null;
          author_name: string;
          category_id: string | null;
          reading_minutes: number | null;
          seo_title: string | null;
          seo_description: string | null;
          og_image_url: string | null;
          canonical_url: string | null;
          noindex: boolean;
          json_ld: Json | null;
          created_at: string;
          updated_at: string;
          search_vector: unknown | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string;
          cover_url?: string | null;
          cover_alt?: string;
          body?: string;
          status?: Database["public"]["Enums"]["blog_status"];
          scheduled_for?: string | null;
          published_at?: string | null;
          author_id?: string | null;
          author_name: string;
          category_id?: string | null;
          reading_minutes?: number | null;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
          canonical_url?: string | null;
          noindex?: boolean;
          json_ld?: Json | null;
          created_at?: string;
          updated_at?: string;
          search_vector?: never;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          excerpt?: string;
          cover_url?: string | null;
          cover_alt?: string;
          body?: string;
          status?: Database["public"]["Enums"]["blog_status"];
          scheduled_for?: string | null;
          published_at?: string | null;
          author_id?: string | null;
          author_name?: string;
          category_id?: string | null;
          reading_minutes?: number | null;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
          canonical_url?: string | null;
          noindex?: boolean;
          json_ld?: Json | null;
          created_at?: string;
          updated_at?: string;
          search_vector?: never;
        };
        Relationships: [
          { foreignKeyName: "blog_posts_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "blog_posts_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "blog_categories"; referencedColumns: ["id"] },
        ];
      };
      blog_tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
        Relationships: [
        ];
      };
      campaign_collections: {
        Row: {
          campaign_id: string;
          collection_id: string;
          sort_order: number;
        };
        Insert: {
          campaign_id: string;
          collection_id: string;
          sort_order?: number;
        };
        Update: {
          campaign_id?: string;
          collection_id?: string;
          sort_order?: number;
        };
        Relationships: [
          { foreignKeyName: "campaign_collections_campaign_id_fkey"; columns: ["campaign_id"]; isOneToOne: false; referencedRelation: "campaigns"; referencedColumns: ["id"] },
          { foreignKeyName: "campaign_collections_collection_id_fkey"; columns: ["collection_id"]; isOneToOne: false; referencedRelation: "collections"; referencedColumns: ["id"] },
        ];
      };
      campaign_products: {
        Row: {
          campaign_id: string;
          product_id: string;
          sort_order: number;
        };
        Insert: {
          campaign_id: string;
          product_id: string;
          sort_order?: number;
        };
        Update: {
          campaign_id?: string;
          product_id?: string;
          sort_order?: number;
        };
        Relationships: [
          { foreignKeyName: "campaign_products_campaign_id_fkey"; columns: ["campaign_id"]; isOneToOne: false; referencedRelation: "campaigns"; referencedColumns: ["id"] },
          { foreignKeyName: "campaign_products_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ];
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: Database["public"]["Enums"]["campaign_status"];
          channel: string;
          description: string | null;
          hero_image_url: string | null;
          hero_image_alt: string | null;
          content: Json;
          utm_campaign: string | null;
          coupon_id: string | null;
          offer_id: string | null;
          budget_paise: number | null;
          metrics: Json;
          starts_at: string | null;
          ends_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: Database["public"]["Enums"]["campaign_status"];
          channel?: string;
          description?: string | null;
          hero_image_url?: string | null;
          hero_image_alt?: string | null;
          content?: Json;
          utm_campaign?: string | null;
          coupon_id?: string | null;
          offer_id?: string | null;
          budget_paise?: number | null;
          metrics?: Json;
          starts_at?: string | null;
          ends_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["campaign_status"];
          channel?: string;
          description?: string | null;
          hero_image_url?: string | null;
          hero_image_alt?: string | null;
          content?: Json;
          utm_campaign?: string | null;
          coupon_id?: string | null;
          offer_id?: string | null;
          budget_paise?: number | null;
          metrics?: Json;
          starts_at?: string | null;
          ends_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "campaigns_coupon_id_fkey"; columns: ["coupon_id"]; isOneToOne: false; referencedRelation: "coupons"; referencedColumns: ["id"] },
          { foreignKeyName: "campaigns_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "campaigns_offer_id_fkey"; columns: ["offer_id"]; isOneToOne: false; referencedRelation: "offers"; referencedColumns: ["id"] },
        ];
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          variant_id: string;
          quantity: number;
          unit_price_snapshot: number;
          variant_title: string;
          options: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          variant_id: string;
          quantity: number;
          unit_price_snapshot?: number;
          variant_title?: string;
          options?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          variant_id?: string;
          quantity?: number;
          unit_price_snapshot?: number;
          variant_title?: string;
          options?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "cart_items_cart_id_fkey"; columns: ["cart_id"]; isOneToOne: false; referencedRelation: "carts"; referencedColumns: ["id"] },
          { foreignKeyName: "cart_items_variant_id_fkey"; columns: ["variant_id"]; isOneToOne: false; referencedRelation: "product_variants"; referencedColumns: ["id"] },
        ];
      };
      carts: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          status: Database["public"]["Enums"]["cart_status"];
          coupon_code: string | null;
          currency: string;
          converted_order_id: string | null;
          merged_into_id: string | null;
          last_activity_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          status?: Database["public"]["Enums"]["cart_status"];
          coupon_code?: string | null;
          currency?: string;
          converted_order_id?: string | null;
          merged_into_id?: string | null;
          last_activity_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          status?: Database["public"]["Enums"]["cart_status"];
          coupon_code?: string | null;
          currency?: string;
          converted_order_id?: string | null;
          merged_into_id?: string | null;
          last_activity_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "carts_converted_order_fk"; columns: ["converted_order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "carts_merged_into_id_fkey"; columns: ["merged_into_id"]; isOneToOne: false; referencedRelation: "carts"; referencedColumns: ["id"] },
          { foreignKeyName: "carts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      categories: {
        Row: {
          id: string;
          parent_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          image_alt: string | null;
          banner_url: string | null;
          banner_alt: string | null;
          sort_order: number;
          is_active: boolean;
          show_on_home: boolean;
          seo_title: string | null;
          seo_description: string | null;
          og_image_url: string | null;
          canonical_url: string | null;
          noindex: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          image_alt?: string | null;
          banner_url?: string | null;
          banner_alt?: string | null;
          sort_order?: number;
          is_active?: boolean;
          show_on_home?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
          canonical_url?: string | null;
          noindex?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          image_alt?: string | null;
          banner_url?: string | null;
          banner_alt?: string | null;
          sort_order?: number;
          is_active?: boolean;
          show_on_home?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
          canonical_url?: string | null;
          noindex?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "categories_parent_id_fkey"; columns: ["parent_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] },
        ];
      };
      checkout_sessions: {
        Row: {
          id: string;
          idempotency_key: string;
          cart_id: string | null;
          user_id: string | null;
          visitor_session_id: string | null;
          email: string | null;
          phone: string | null;
          customer_name: string | null;
          shipping_address: Json | null;
          billing_address: Json | null;
          shipping_method_id: string | null;
          coupon_code: string | null;
          payment_provider: Database["public"]["Enums"]["payment_provider"] | null;
          quote: Json | null;
          status: Database["public"]["Enums"]["checkout_status"];
          order_id: string | null;
          expires_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          idempotency_key: string;
          cart_id?: string | null;
          user_id?: string | null;
          visitor_session_id?: string | null;
          email?: string | null;
          phone?: string | null;
          customer_name?: string | null;
          shipping_address?: Json | null;
          billing_address?: Json | null;
          shipping_method_id?: string | null;
          coupon_code?: string | null;
          payment_provider?: Database["public"]["Enums"]["payment_provider"] | null;
          quote?: Json | null;
          status?: Database["public"]["Enums"]["checkout_status"];
          order_id?: string | null;
          expires_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          idempotency_key?: string;
          cart_id?: string | null;
          user_id?: string | null;
          visitor_session_id?: string | null;
          email?: string | null;
          phone?: string | null;
          customer_name?: string | null;
          shipping_address?: Json | null;
          billing_address?: Json | null;
          shipping_method_id?: string | null;
          coupon_code?: string | null;
          payment_provider?: Database["public"]["Enums"]["payment_provider"] | null;
          quote?: Json | null;
          status?: Database["public"]["Enums"]["checkout_status"];
          order_id?: string | null;
          expires_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "checkout_sessions_cart_id_fkey"; columns: ["cart_id"]; isOneToOne: false; referencedRelation: "carts"; referencedColumns: ["id"] },
          { foreignKeyName: "checkout_sessions_order_fk"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "checkout_sessions_shipping_method_id_fkey"; columns: ["shipping_method_id"]; isOneToOne: false; referencedRelation: "shipping_methods"; referencedColumns: ["id"] },
          { foreignKeyName: "checkout_sessions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      collection_products: {
        Row: {
          collection_id: string;
          product_id: string;
          position: number;
          created_at: string;
        };
        Insert: {
          collection_id: string;
          product_id: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          collection_id?: string;
          product_id?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "collection_products_collection_id_fkey"; columns: ["collection_id"]; isOneToOne: false; referencedRelation: "collections"; referencedColumns: ["id"] },
          { foreignKeyName: "collection_products_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ];
      };
      collections: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          image_alt: string | null;
          banner_url: string | null;
          banner_alt: string | null;
          sort_order: number;
          is_active: boolean;
          show_on_home: boolean;
          starts_at: string | null;
          ends_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          og_image_url: string | null;
          canonical_url: string | null;
          noindex: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          image_alt?: string | null;
          banner_url?: string | null;
          banner_alt?: string | null;
          sort_order?: number;
          is_active?: boolean;
          show_on_home?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
          canonical_url?: string | null;
          noindex?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          image_alt?: string | null;
          banner_url?: string | null;
          banner_alt?: string | null;
          sort_order?: number;
          is_active?: boolean;
          show_on_home?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
          canonical_url?: string | null;
          noindex?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
        ];
      };
      content_pages: {
        Row: {
          id: string;
          slug: string;
          page_type: string;
          title: string;
          blocks: Json;
          status: Database["public"]["Enums"]["content_status"];
          published_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          og_image_url: string | null;
          canonical_url: string | null;
          noindex: boolean;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          page_type: string;
          title: string;
          blocks?: Json;
          status?: Database["public"]["Enums"]["content_status"];
          published_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
          canonical_url?: string | null;
          noindex?: boolean;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          page_type?: string;
          title?: string;
          blocks?: Json;
          status?: Database["public"]["Enums"]["content_status"];
          published_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
          canonical_url?: string | null;
          noindex?: boolean;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "content_pages_updated_by_fkey"; columns: ["updated_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      coupon_redemptions: {
        Row: {
          id: string;
          coupon_id: string;
          order_id: string;
          user_id: string | null;
          email: string;
          discount_amount: number;
          status: Database["public"]["Enums"]["redemption_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coupon_id: string;
          order_id: string;
          user_id?: string | null;
          email: string;
          discount_amount: number;
          status?: Database["public"]["Enums"]["redemption_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coupon_id?: string;
          order_id?: string;
          user_id?: string | null;
          email?: string;
          discount_amount?: number;
          status?: Database["public"]["Enums"]["redemption_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "coupon_redemptions_coupon_id_fkey"; columns: ["coupon_id"]; isOneToOne: false; referencedRelation: "coupons"; referencedColumns: ["id"] },
          { foreignKeyName: "coupon_redemptions_order_id_fkey"; columns: ["order_id"]; isOneToOne: true; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "coupon_redemptions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          type: Database["public"]["Enums"]["coupon_type"];
          value: number;
          min_order_amount: number;
          max_discount_amount: number | null;
          usage_limit_total: number | null;
          usage_limit_per_user: number | null;
          usage_count: number;
          first_order_only: boolean;
          combinable_with_offers: boolean;
          starts_at: string | null;
          ends_at: string | null;
          status: Database["public"]["Enums"]["coupon_status"];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          type: Database["public"]["Enums"]["coupon_type"];
          value?: number;
          min_order_amount?: number;
          max_discount_amount?: number | null;
          usage_limit_total?: number | null;
          usage_limit_per_user?: number | null;
          usage_count?: number;
          first_order_only?: boolean;
          combinable_with_offers?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          status?: Database["public"]["Enums"]["coupon_status"];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          description?: string | null;
          type?: Database["public"]["Enums"]["coupon_type"];
          value?: number;
          min_order_amount?: number;
          max_discount_amount?: number | null;
          usage_limit_total?: number | null;
          usage_limit_per_user?: number | null;
          usage_count?: number;
          first_order_only?: boolean;
          combinable_with_offers?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          status?: Database["public"]["Enums"]["coupon_status"];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "coupons_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      discount_targets: {
        Row: {
          id: string;
          coupon_id: string | null;
          offer_id: string | null;
          mode: Database["public"]["Enums"]["target_mode"];
          product_id: string | null;
          variant_id: string | null;
          category_id: string | null;
          collection_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          coupon_id?: string | null;
          offer_id?: string | null;
          mode?: Database["public"]["Enums"]["target_mode"];
          product_id?: string | null;
          variant_id?: string | null;
          category_id?: string | null;
          collection_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          coupon_id?: string | null;
          offer_id?: string | null;
          mode?: Database["public"]["Enums"]["target_mode"];
          product_id?: string | null;
          variant_id?: string | null;
          category_id?: string | null;
          collection_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "discount_targets_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] },
          { foreignKeyName: "discount_targets_collection_id_fkey"; columns: ["collection_id"]; isOneToOne: false; referencedRelation: "collections"; referencedColumns: ["id"] },
          { foreignKeyName: "discount_targets_coupon_id_fkey"; columns: ["coupon_id"]; isOneToOne: false; referencedRelation: "coupons"; referencedColumns: ["id"] },
          { foreignKeyName: "discount_targets_offer_id_fkey"; columns: ["offer_id"]; isOneToOne: false; referencedRelation: "offers"; referencedColumns: ["id"] },
          { foreignKeyName: "discount_targets_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
          { foreignKeyName: "discount_targets_variant_id_fkey"; columns: ["variant_id"]; isOneToOne: false; referencedRelation: "product_variants"; referencedColumns: ["id"] },
        ];
      };
      faqs: {
        Row: {
          id: string;
          category: string;
          question: string;
          answer: string;
          sort_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category?: string;
          question: string;
          answer: string;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          question?: string;
          answer?: string;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
        ];
      };
      home_sections: {
        Row: {
          id: string;
          type: Database["public"]["Enums"]["home_section_type"];
          title: string | null;
          subtitle: string | null;
          config: Json;
          sort_order: number;
          is_active: boolean;
          starts_at: string | null;
          ends_at: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: Database["public"]["Enums"]["home_section_type"];
          title?: string | null;
          subtitle?: string | null;
          config?: Json;
          sort_order?: number;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: Database["public"]["Enums"]["home_section_type"];
          title?: string | null;
          subtitle?: string | null;
          config?: Json;
          sort_order?: number;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "home_sections_updated_by_fkey"; columns: ["updated_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      integration_configs: {
        Row: {
          id: string;
          provider: string;
          environment: string;
          is_active: boolean;
          status: Database["public"]["Enums"]["integration_status"];
          config: Json;
          secret_ref: string | null;
          last_checked_at: string | null;
          last_error: string | null;
          last_error_at: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          environment?: string;
          is_active?: boolean;
          status?: Database["public"]["Enums"]["integration_status"];
          config?: Json;
          secret_ref?: string | null;
          last_checked_at?: string | null;
          last_error?: string | null;
          last_error_at?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          environment?: string;
          is_active?: boolean;
          status?: Database["public"]["Enums"]["integration_status"];
          config?: Json;
          secret_ref?: string | null;
          last_checked_at?: string | null;
          last_error?: string | null;
          last_error_at?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "integration_configs_updated_by_fkey"; columns: ["updated_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      inventory: {
        Row: {
          variant_id: string;
          on_hand: number;
          reserved: number;
          available: number | null;
          updated_at: string;
        };
        Insert: {
          variant_id: string;
          on_hand?: number;
          reserved?: number;
          available?: never;
          updated_at?: string;
        };
        Update: {
          variant_id?: string;
          on_hand?: number;
          reserved?: number;
          available?: never;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "inventory_variant_id_fkey"; columns: ["variant_id"]; isOneToOne: true; referencedRelation: "product_variants"; referencedColumns: ["id"] },
        ];
      };
      inventory_movements: {
        Row: {
          id: number;
          variant_id: string;
          reason: Database["public"]["Enums"]["inventory_reason"];
          delta_on_hand: number;
          delta_reserved: number;
          on_hand_after: number;
          reserved_after: number;
          reference_type: string | null;
          reference_id: string | null;
          note: string | null;
          actor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          variant_id: string;
          reason: Database["public"]["Enums"]["inventory_reason"];
          delta_on_hand?: number;
          delta_reserved?: number;
          on_hand_after: number;
          reserved_after: number;
          reference_type?: string | null;
          reference_id?: string | null;
          note?: string | null;
          actor_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          variant_id?: string;
          reason?: Database["public"]["Enums"]["inventory_reason"];
          delta_on_hand?: number;
          delta_reserved?: number;
          on_hand_after?: number;
          reserved_after?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          note?: string | null;
          actor_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "inventory_movements_actor_id_fkey"; columns: ["actor_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "inventory_movements_variant_id_fkey"; columns: ["variant_id"]; isOneToOne: false; referencedRelation: "product_variants"; referencedColumns: ["id"] },
        ];
      };
      inventory_reservations: {
        Row: {
          id: string;
          variant_id: string;
          quantity: number;
          status: Database["public"]["Enums"]["reservation_status"];
          order_id: string | null;
          checkout_session_id: string | null;
          expires_at: string | null;
          released_at: string | null;
          consumed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          quantity: number;
          status?: Database["public"]["Enums"]["reservation_status"];
          order_id?: string | null;
          checkout_session_id?: string | null;
          expires_at?: string | null;
          released_at?: string | null;
          consumed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          quantity?: number;
          status?: Database["public"]["Enums"]["reservation_status"];
          order_id?: string | null;
          checkout_session_id?: string | null;
          expires_at?: string | null;
          released_at?: string | null;
          consumed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "inventory_reservations_checkout_fk"; columns: ["checkout_session_id"]; isOneToOne: false; referencedRelation: "checkout_sessions"; referencedColumns: ["id"] },
          { foreignKeyName: "inventory_reservations_order_fk"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "inventory_reservations_variant_id_fkey"; columns: ["variant_id"]; isOneToOne: false; referencedRelation: "product_variants"; referencedColumns: ["id"] },
        ];
      };
      lookbook_entries: {
        Row: {
          id: string;
          title: string;
          season: string | null;
          description: string | null;
          image_url: string;
          image_alt: string;
          sort_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          season?: string | null;
          description?: string | null;
          image_url: string;
          image_alt?: string;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          season?: string | null;
          description?: string | null;
          image_url?: string;
          image_alt?: string;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
        ];
      };
      lookbook_entry_products: {
        Row: {
          entry_id: string;
          product_id: string;
          hotspot_x: number | null;
          hotspot_y: number | null;
        };
        Insert: {
          entry_id: string;
          product_id: string;
          hotspot_x?: number | null;
          hotspot_y?: number | null;
        };
        Update: {
          entry_id?: string;
          product_id?: string;
          hotspot_x?: number | null;
          hotspot_y?: number | null;
        };
        Relationships: [
          { foreignKeyName: "lookbook_entry_products_entry_id_fkey"; columns: ["entry_id"]; isOneToOne: false; referencedRelation: "lookbook_entries"; referencedColumns: ["id"] },
          { foreignKeyName: "lookbook_entry_products_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ];
      };
      notification_log: {
        Row: {
          id: string;
          channel: string;
          provider: string;
          template: string;
          idempotency_key: string | null;
          to_address: string;
          subject: string | null;
          user_id: string | null;
          order_id: string | null;
          status: Database["public"]["Enums"]["notification_status"];
          provider_message_id: string | null;
          error: string | null;
          payload: Json;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          channel?: string;
          provider?: string;
          template: string;
          idempotency_key?: string | null;
          to_address: string;
          subject?: string | null;
          user_id?: string | null;
          order_id?: string | null;
          status?: Database["public"]["Enums"]["notification_status"];
          provider_message_id?: string | null;
          error?: string | null;
          payload?: Json;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          channel?: string;
          provider?: string;
          template?: string;
          idempotency_key?: string | null;
          to_address?: string;
          subject?: string | null;
          user_id?: string | null;
          order_id?: string | null;
          status?: Database["public"]["Enums"]["notification_status"];
          provider_message_id?: string | null;
          error?: string | null;
          payload?: Json;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "notification_log_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "notification_log_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      offer_redemptions: {
        Row: {
          id: string;
          offer_id: string;
          order_id: string;
          applications: number;
          discount_amount: number;
          status: Database["public"]["Enums"]["redemption_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          offer_id: string;
          order_id: string;
          applications?: number;
          discount_amount: number;
          status?: Database["public"]["Enums"]["redemption_status"];
          created_at?: string;
        };
        Update: {
          id?: string;
          offer_id?: string;
          order_id?: string;
          applications?: number;
          discount_amount?: number;
          status?: Database["public"]["Enums"]["redemption_status"];
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "offer_redemptions_offer_id_fkey"; columns: ["offer_id"]; isOneToOne: false; referencedRelation: "offers"; referencedColumns: ["id"] },
          { foreignKeyName: "offer_redemptions_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
        ];
      };
      offers: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          type: Database["public"]["Enums"]["offer_type"];
          status: Database["public"]["Enums"]["coupon_status"];
          priority: number;
          required_qty: number | null;
          bundle_price: number | null;
          buy_qty: number | null;
          get_qty: number | null;
          get_discount_percent: number | null;
          tiers: Json | null;
          max_applications_per_order: number | null;
          usage_limit_total: number | null;
          usage_count: number;
          starts_at: string | null;
          ends_at: string | null;
          badge_text: string | null;
          nudge_template: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          type: Database["public"]["Enums"]["offer_type"];
          status?: Database["public"]["Enums"]["coupon_status"];
          priority?: number;
          required_qty?: number | null;
          bundle_price?: number | null;
          buy_qty?: number | null;
          get_qty?: number | null;
          get_discount_percent?: number | null;
          tiers?: Json | null;
          max_applications_per_order?: number | null;
          usage_limit_total?: number | null;
          usage_count?: number;
          starts_at?: string | null;
          ends_at?: string | null;
          badge_text?: string | null;
          nudge_template?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          type?: Database["public"]["Enums"]["offer_type"];
          status?: Database["public"]["Enums"]["coupon_status"];
          priority?: number;
          required_qty?: number | null;
          bundle_price?: number | null;
          buy_qty?: number | null;
          get_qty?: number | null;
          get_discount_percent?: number | null;
          tiers?: Json | null;
          max_applications_per_order?: number | null;
          usage_limit_total?: number | null;
          usage_count?: number;
          starts_at?: string | null;
          ends_at?: string | null;
          badge_text?: string | null;
          nudge_template?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "offers_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          sku: string;
          product_name: string;
          brand: string | null;
          variant_title: string;
          options: Json;
          hsn_code: string | null;
          return_window_days: number;
          image_url: string | null;
          unit_price: number;
          compare_at_price: number | null;
          quantity: number;
          line_subtotal: number;
          discount_allocated: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          sku: string;
          product_name: string;
          brand?: string | null;
          variant_title: string;
          options?: Json;
          hsn_code?: string | null;
          return_window_days?: number;
          image_url?: string | null;
          unit_price: number;
          compare_at_price?: number | null;
          quantity: number;
          line_subtotal: number;
          discount_allocated?: number;
          line_total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          variant_id?: string | null;
          sku?: string;
          product_name?: string;
          brand?: string | null;
          variant_title?: string;
          options?: Json;
          hsn_code?: string | null;
          return_window_days?: number;
          image_url?: string | null;
          unit_price?: number;
          compare_at_price?: number | null;
          quantity?: number;
          line_subtotal?: number;
          discount_allocated?: number;
          line_total?: number;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "order_items_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "order_items_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
          { foreignKeyName: "order_items_variant_id_fkey"; columns: ["variant_id"]; isOneToOne: false; referencedRelation: "product_variants"; referencedColumns: ["id"] },
        ];
      };
      order_status_history: {
        Row: {
          id: number;
          order_id: string;
          from_status: Database["public"]["Enums"]["order_status"] | null;
          to_status: Database["public"]["Enums"]["order_status"];
          actor_id: string | null;
          actor_type: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          order_id: string;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          to_status: Database["public"]["Enums"]["order_status"];
          actor_id?: string | null;
          actor_type?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          order_id?: string;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          to_status?: Database["public"]["Enums"]["order_status"];
          actor_id?: string | null;
          actor_type?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "order_status_history_actor_id_fkey"; columns: ["actor_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "order_status_history_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          idempotency_key: string;
          checkout_session_id: string | null;
          cart_id: string | null;
          user_id: string | null;
          visitor_session_id: string | null;
          status: Database["public"]["Enums"]["order_status"];
          payment_status: Database["public"]["Enums"]["payment_status"];
          payment_provider: Database["public"]["Enums"]["payment_provider"];
          email: string;
          phone: string;
          customer_name: string;
          shipping_address: Json;
          billing_address: Json | null;
          shipping_method_id: string | null;
          shipping_method_name: string | null;
          currency: string;
          subtotal: number;
          discount_total: number;
          shipping_total: number;
          cod_fee: number;
          tax_total: number;
          total: number;
          tax_rate: number;
          tax_inclusive: boolean;
          coupon_id: string | null;
          coupon_code: string | null;
          applied_discounts: Json;
          pricing_snapshot: Json | null;
          notes: string | null;
          customer_ip: string | null;
          user_agent: string | null;
          tracking_token: string;
          placed_at: string;
          paid_at: string | null;
          cancelled_at: string | null;
          cancel_reason: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          idempotency_key: string;
          checkout_session_id?: string | null;
          cart_id?: string | null;
          user_id?: string | null;
          visitor_session_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          payment_provider: Database["public"]["Enums"]["payment_provider"];
          email: string;
          phone: string;
          customer_name: string;
          shipping_address: Json;
          billing_address?: Json | null;
          shipping_method_id?: string | null;
          shipping_method_name?: string | null;
          currency?: string;
          subtotal: number;
          discount_total?: number;
          shipping_total?: number;
          cod_fee?: number;
          tax_total?: number;
          total: number;
          tax_rate: number;
          tax_inclusive: boolean;
          coupon_id?: string | null;
          coupon_code?: string | null;
          applied_discounts?: Json;
          pricing_snapshot?: Json | null;
          notes?: string | null;
          customer_ip?: string | null;
          user_agent?: string | null;
          tracking_token?: string;
          placed_at?: string;
          paid_at?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          idempotency_key?: string;
          checkout_session_id?: string | null;
          cart_id?: string | null;
          user_id?: string | null;
          visitor_session_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          payment_provider?: Database["public"]["Enums"]["payment_provider"];
          email?: string;
          phone?: string;
          customer_name?: string;
          shipping_address?: Json;
          billing_address?: Json | null;
          shipping_method_id?: string | null;
          shipping_method_name?: string | null;
          currency?: string;
          subtotal?: number;
          discount_total?: number;
          shipping_total?: number;
          cod_fee?: number;
          tax_total?: number;
          total?: number;
          tax_rate?: number;
          tax_inclusive?: boolean;
          coupon_id?: string | null;
          coupon_code?: string | null;
          applied_discounts?: Json;
          pricing_snapshot?: Json | null;
          notes?: string | null;
          customer_ip?: string | null;
          user_agent?: string | null;
          tracking_token?: string;
          placed_at?: string;
          paid_at?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "orders_cart_id_fkey"; columns: ["cart_id"]; isOneToOne: false; referencedRelation: "carts"; referencedColumns: ["id"] },
          { foreignKeyName: "orders_checkout_session_id_fkey"; columns: ["checkout_session_id"]; isOneToOne: true; referencedRelation: "checkout_sessions"; referencedColumns: ["id"] },
          { foreignKeyName: "orders_coupon_fk"; columns: ["coupon_id"]; isOneToOne: false; referencedRelation: "coupons"; referencedColumns: ["id"] },
          { foreignKeyName: "orders_shipping_method_id_fkey"; columns: ["shipping_method_id"]; isOneToOne: false; referencedRelation: "shipping_methods"; referencedColumns: ["id"] },
          { foreignKeyName: "orders_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      payment_attempts: {
        Row: {
          id: string;
          payment_id: string;
          order_id: string;
          attempt_no: number;
          provider: Database["public"]["Enums"]["payment_provider"];
          status: Database["public"]["Enums"]["payment_attempt_status"];
          method: Database["public"]["Enums"]["payment_method"] | null;
          amount: number;
          provider_order_id: string | null;
          provider_payment_id: string | null;
          failure_stage: Database["public"]["Enums"]["payment_failure_stage"] | null;
          failure_source: string | null;
          failure_code: string | null;
          failure_reason: string | null;
          method_details: Json | null;
          raw_request: Json | null;
          raw_response: Json | null;
          client_ip: string | null;
          user_agent: string | null;
          started_at: string;
          checkout_opened_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          payment_id: string;
          order_id: string;
          attempt_no: number;
          provider: Database["public"]["Enums"]["payment_provider"];
          status?: Database["public"]["Enums"]["payment_attempt_status"];
          method?: Database["public"]["Enums"]["payment_method"] | null;
          amount: number;
          provider_order_id?: string | null;
          provider_payment_id?: string | null;
          failure_stage?: Database["public"]["Enums"]["payment_failure_stage"] | null;
          failure_source?: string | null;
          failure_code?: string | null;
          failure_reason?: string | null;
          method_details?: Json | null;
          raw_request?: Json | null;
          raw_response?: Json | null;
          client_ip?: string | null;
          user_agent?: string | null;
          started_at?: string;
          checkout_opened_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          payment_id?: string;
          order_id?: string;
          attempt_no?: number;
          provider?: Database["public"]["Enums"]["payment_provider"];
          status?: Database["public"]["Enums"]["payment_attempt_status"];
          method?: Database["public"]["Enums"]["payment_method"] | null;
          amount?: number;
          provider_order_id?: string | null;
          provider_payment_id?: string | null;
          failure_stage?: Database["public"]["Enums"]["payment_failure_stage"] | null;
          failure_source?: string | null;
          failure_code?: string | null;
          failure_reason?: string | null;
          method_details?: Json | null;
          raw_request?: Json | null;
          raw_response?: Json | null;
          client_ip?: string | null;
          user_agent?: string | null;
          started_at?: string;
          checkout_opened_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "payment_attempts_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "payment_attempts_payment_id_fkey"; columns: ["payment_id"]; isOneToOne: false; referencedRelation: "payments"; referencedColumns: ["id"] },
        ];
      };
      payment_events: {
        Row: {
          id: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_event_id: string;
          event_type: string;
          source: string;
          signature_valid: boolean | null;
          order_id: string | null;
          payment_id: string | null;
          attempt_id: string | null;
          provider_order_id: string | null;
          provider_payment_id: string | null;
          payload: Json;
          processing_status: string;
          processing_error: string | null;
          received_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_event_id: string;
          event_type: string;
          source?: string;
          signature_valid?: boolean | null;
          order_id?: string | null;
          payment_id?: string | null;
          attempt_id?: string | null;
          provider_order_id?: string | null;
          provider_payment_id?: string | null;
          payload: Json;
          processing_status?: string;
          processing_error?: string | null;
          received_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          provider?: Database["public"]["Enums"]["payment_provider"];
          provider_event_id?: string;
          event_type?: string;
          source?: string;
          signature_valid?: boolean | null;
          order_id?: string | null;
          payment_id?: string | null;
          attempt_id?: string | null;
          provider_order_id?: string | null;
          provider_payment_id?: string | null;
          payload?: Json;
          processing_status?: string;
          processing_error?: string | null;
          received_at?: string;
          processed_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "payment_events_attempt_id_fkey"; columns: ["attempt_id"]; isOneToOne: false; referencedRelation: "payment_attempts"; referencedColumns: ["id"] },
          { foreignKeyName: "payment_events_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "payment_events_payment_id_fkey"; columns: ["payment_id"]; isOneToOne: false; referencedRelation: "payments"; referencedColumns: ["id"] },
        ];
      };
      payment_gateways: {
        Row: {
          id: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          display_name: string;
          description: string | null;
          is_enabled: boolean;
          mode: Database["public"]["Enums"]["gateway_mode"];
          sort_order: number;
          supported_methods: Database["public"]["Enums"]["payment_method"][];
          min_amount: number | null;
          max_amount: number | null;
          config: Json;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          display_name: string;
          description?: string | null;
          is_enabled?: boolean;
          mode?: Database["public"]["Enums"]["gateway_mode"];
          sort_order?: number;
          supported_methods?: Database["public"]["Enums"]["payment_method"][];
          min_amount?: number | null;
          max_amount?: number | null;
          config?: Json;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider?: Database["public"]["Enums"]["payment_provider"];
          display_name?: string;
          description?: string | null;
          is_enabled?: boolean;
          mode?: Database["public"]["Enums"]["gateway_mode"];
          sort_order?: number;
          supported_methods?: Database["public"]["Enums"]["payment_method"][];
          min_amount?: number | null;
          max_amount?: number | null;
          config?: Json;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "payment_gateways_updated_by_fkey"; columns: ["updated_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          status: Database["public"]["Enums"]["payment_status"];
          method: Database["public"]["Enums"]["payment_method"] | null;
          amount: number;
          amount_captured: number;
          amount_refunded: number;
          currency: string;
          provider_order_id: string | null;
          provider_payment_id: string | null;
          attempt_count: number;
          last_failure_stage: Database["public"]["Enums"]["payment_failure_stage"] | null;
          last_failure_code: string | null;
          last_failure_reason: string | null;
          authorized_at: string | null;
          captured_at: string | null;
          failed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          status?: Database["public"]["Enums"]["payment_status"];
          method?: Database["public"]["Enums"]["payment_method"] | null;
          amount: number;
          amount_captured?: number;
          amount_refunded?: number;
          currency?: string;
          provider_order_id?: string | null;
          provider_payment_id?: string | null;
          attempt_count?: number;
          last_failure_stage?: Database["public"]["Enums"]["payment_failure_stage"] | null;
          last_failure_code?: string | null;
          last_failure_reason?: string | null;
          authorized_at?: string | null;
          captured_at?: string | null;
          failed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          provider?: Database["public"]["Enums"]["payment_provider"];
          status?: Database["public"]["Enums"]["payment_status"];
          method?: Database["public"]["Enums"]["payment_method"] | null;
          amount?: number;
          amount_captured?: number;
          amount_refunded?: number;
          currency?: string;
          provider_order_id?: string | null;
          provider_payment_id?: string | null;
          attempt_count?: number;
          last_failure_stage?: Database["public"]["Enums"]["payment_failure_stage"] | null;
          last_failure_code?: string | null;
          last_failure_reason?: string | null;
          authorized_at?: string | null;
          captured_at?: string | null;
          failed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "payments_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
        ];
      };
      permissions: {
        Row: {
          code: string;
          module: string;
          description: string;
          created_at: string;
        };
        Insert: {
          code: string;
          module: string;
          description: string;
          created_at?: string;
        };
        Update: {
          code?: string;
          module?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [
        ];
      };
      product_attribute_values: {
        Row: {
          product_id: string;
          attribute_value_id: string;
        };
        Insert: {
          product_id: string;
          attribute_value_id: string;
        };
        Update: {
          product_id?: string;
          attribute_value_id?: string;
        };
        Relationships: [
          { foreignKeyName: "product_attribute_values_attribute_value_id_fkey"; columns: ["attribute_value_id"]; isOneToOne: false; referencedRelation: "attribute_values"; referencedColumns: ["id"] },
          { foreignKeyName: "product_attribute_values_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ];
      };
      product_media: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          option_value: string | null;
          media_type: string;
          url: string;
          storage_path: string | null;
          alt: string;
          width: number | null;
          height: number | null;
          position: number;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          option_value?: string | null;
          media_type?: string;
          url: string;
          storage_path?: string | null;
          alt?: string;
          width?: number | null;
          height?: number | null;
          position?: number;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          variant_id?: string | null;
          option_value?: string | null;
          media_type?: string;
          url?: string;
          storage_path?: string | null;
          alt?: string;
          width?: number | null;
          height?: number | null;
          position?: number;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "product_media_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
          { foreignKeyName: "product_media_variant_id_fkey"; columns: ["variant_id"]; isOneToOne: false; referencedRelation: "product_variants"; referencedColumns: ["id"] },
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          barcode: string | null;
          option1: string | null;
          option2: string | null;
          option3: string | null;
          title: string;
          color_hex: string | null;
          price: number;
          compare_at_price: number | null;
          cost_price: number | null;
          weight_grams: number | null;
          low_stock_threshold: number | null;
          status: Database["public"]["Enums"]["variant_status"];
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          barcode?: string | null;
          option1?: string | null;
          option2?: string | null;
          option3?: string | null;
          title?: string;
          color_hex?: string | null;
          price: number;
          compare_at_price?: number | null;
          cost_price?: number | null;
          weight_grams?: number | null;
          low_stock_threshold?: number | null;
          status?: Database["public"]["Enums"]["variant_status"];
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string;
          barcode?: string | null;
          option1?: string | null;
          option2?: string | null;
          option3?: string | null;
          title?: string;
          color_hex?: string | null;
          price?: number;
          compare_at_price?: number | null;
          cost_price?: number | null;
          weight_grams?: number | null;
          low_stock_threshold?: number | null;
          status?: Database["public"]["Enums"]["variant_status"];
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "product_variants_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          brand: string | null;
          short_description: string;
          description: string;
          highlights: string[];
          specifications: Json;
          tags: string[];
          badges: string[];
          option_names: string[];
          size_chart: Json | null;
          weight_grams: number | null;
          length_mm: number | null;
          width_mm: number | null;
          height_mm: number | null;
          hsn_code: string | null;
          country_of_origin: string;
          warranty: string | null;
          returnable: boolean;
          return_window_days: number | null;
          return_policy: string | null;
          status: Database["public"]["Enums"]["product_status"];
          published_at: string | null;
          is_featured: boolean;
          sort_order: number;
          price_min: number | null;
          price_max: number | null;
          compare_at_min: number | null;
          rating_avg: number;
          review_count: number;
          rating_override: number | null;
          review_count_override: number | null;
          rating_display: number | null;
          review_count_display: number | null;
          seo_title: string | null;
          seo_description: string | null;
          og_image_url: string | null;
          canonical_url: string | null;
          noindex: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          search_vector: unknown | null;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          brand?: string | null;
          short_description?: string;
          description?: string;
          highlights?: string[];
          specifications?: Json;
          tags?: string[];
          badges?: string[];
          option_names?: string[];
          size_chart?: Json | null;
          weight_grams?: number | null;
          length_mm?: number | null;
          width_mm?: number | null;
          height_mm?: number | null;
          hsn_code?: string | null;
          country_of_origin?: string;
          warranty?: string | null;
          returnable?: boolean;
          return_window_days?: number | null;
          return_policy?: string | null;
          status?: Database["public"]["Enums"]["product_status"];
          published_at?: string | null;
          is_featured?: boolean;
          sort_order?: number;
          price_min?: number | null;
          price_max?: number | null;
          compare_at_min?: number | null;
          rating_avg?: number;
          review_count?: number;
          rating_override?: number | null;
          review_count_override?: number | null;
          rating_display?: never;
          review_count_display?: never;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
          canonical_url?: string | null;
          noindex?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          search_vector?: never;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          slug?: string;
          brand?: string | null;
          short_description?: string;
          description?: string;
          highlights?: string[];
          specifications?: Json;
          tags?: string[];
          badges?: string[];
          option_names?: string[];
          size_chart?: Json | null;
          weight_grams?: number | null;
          length_mm?: number | null;
          width_mm?: number | null;
          height_mm?: number | null;
          hsn_code?: string | null;
          country_of_origin?: string;
          warranty?: string | null;
          returnable?: boolean;
          return_window_days?: number | null;
          return_policy?: string | null;
          status?: Database["public"]["Enums"]["product_status"];
          published_at?: string | null;
          is_featured?: boolean;
          sort_order?: number;
          price_min?: number | null;
          price_max?: number | null;
          compare_at_min?: number | null;
          rating_avg?: number;
          review_count?: number;
          rating_override?: number | null;
          review_count_override?: number | null;
          rating_display?: never;
          review_count_display?: never;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
          canonical_url?: string | null;
          noindex?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          search_vector?: never;
        };
        Relationships: [
          { foreignKeyName: "products_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] },
          { foreignKeyName: "products_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: Database["public"]["Enums"]["user_role"];
          status: Database["public"]["Enums"]["account_status"];
          marketing_opt_in: boolean;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["account_status"];
          marketing_opt_in?: boolean;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["account_status"];
          marketing_opt_in?: boolean;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
        ];
      };
      redirects: {
        Row: {
          id: string;
          from_path: string;
          to_path: string;
          status_code: number;
          is_active: boolean;
          hit_count: number;
          last_hit_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          from_path: string;
          to_path: string;
          status_code?: number;
          is_active?: boolean;
          hit_count?: number;
          last_hit_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          from_path?: string;
          to_path?: string;
          status_code?: number;
          is_active?: boolean;
          hit_count?: number;
          last_hit_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "redirects_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      refunds: {
        Row: {
          id: string;
          payment_id: string;
          order_id: string;
          attempt_id: string | null;
          return_request_id: string | null;
          amount: number;
          reason: string;
          status: Database["public"]["Enums"]["refund_status"];
          provider_refund_id: string | null;
          idempotency_key: string;
          initiated_by: string | null;
          failure_code: string | null;
          failure_reason: string | null;
          raw_request: Json | null;
          raw_response: Json | null;
          processed_at: string | null;
          failed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          payment_id: string;
          order_id: string;
          attempt_id?: string | null;
          return_request_id?: string | null;
          amount: number;
          reason: string;
          status?: Database["public"]["Enums"]["refund_status"];
          provider_refund_id?: string | null;
          idempotency_key: string;
          initiated_by?: string | null;
          failure_code?: string | null;
          failure_reason?: string | null;
          raw_request?: Json | null;
          raw_response?: Json | null;
          processed_at?: string | null;
          failed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          payment_id?: string;
          order_id?: string;
          attempt_id?: string | null;
          return_request_id?: string | null;
          amount?: number;
          reason?: string;
          status?: Database["public"]["Enums"]["refund_status"];
          provider_refund_id?: string | null;
          idempotency_key?: string;
          initiated_by?: string | null;
          failure_code?: string | null;
          failure_reason?: string | null;
          raw_request?: Json | null;
          raw_response?: Json | null;
          processed_at?: string | null;
          failed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "refunds_attempt_id_fkey"; columns: ["attempt_id"]; isOneToOne: false; referencedRelation: "payment_attempts"; referencedColumns: ["id"] },
          { foreignKeyName: "refunds_initiated_by_fkey"; columns: ["initiated_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "refunds_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "refunds_payment_id_fkey"; columns: ["payment_id"]; isOneToOne: false; referencedRelation: "payments"; referencedColumns: ["id"] },
          { foreignKeyName: "refunds_return_request_fk"; columns: ["return_request_id"]; isOneToOne: false; referencedRelation: "return_requests"; referencedColumns: ["id"] },
        ];
      };
      related_products: {
        Row: {
          product_id: string;
          related_product_id: string;
          relation_type: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          product_id: string;
          related_product_id: string;
          relation_type?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          product_id?: string;
          related_product_id?: string;
          relation_type?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "related_products_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
          { foreignKeyName: "related_products_related_product_id_fkey"; columns: ["related_product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ];
      };
      return_evidence: {
        Row: {
          id: string;
          return_request_id: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          return_request_id: string;
          storage_path: string;
          mime_type: string;
          size_bytes?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          return_request_id?: string;
          storage_path?: string;
          mime_type?: string;
          size_bytes?: number | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "return_evidence_return_request_id_fkey"; columns: ["return_request_id"]; isOneToOne: false; referencedRelation: "return_requests"; referencedColumns: ["id"] },
        ];
      };
      return_items: {
        Row: {
          id: string;
          return_request_id: string;
          order_item_id: string;
          quantity: number;
          reason: Database["public"]["Enums"]["return_reason"] | null;
          condition: string | null;
          restocked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          return_request_id: string;
          order_item_id: string;
          quantity: number;
          reason?: Database["public"]["Enums"]["return_reason"] | null;
          condition?: string | null;
          restocked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          return_request_id?: string;
          order_item_id?: string;
          quantity?: number;
          reason?: Database["public"]["Enums"]["return_reason"] | null;
          condition?: string | null;
          restocked?: boolean;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "return_items_order_item_id_fkey"; columns: ["order_item_id"]; isOneToOne: false; referencedRelation: "order_items"; referencedColumns: ["id"] },
          { foreignKeyName: "return_items_return_request_id_fkey"; columns: ["return_request_id"]; isOneToOne: false; referencedRelation: "return_requests"; referencedColumns: ["id"] },
        ];
      };
      return_requests: {
        Row: {
          id: string;
          rma_number: string;
          order_id: string;
          user_id: string | null;
          status: Database["public"]["Enums"]["return_status"];
          reason: Database["public"]["Enums"]["return_reason"];
          customer_note: string | null;
          resolution: string;
          refund_amount: number | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          pickup_shipment_id: string | null;
          received_at: string | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rma_number?: string;
          order_id: string;
          user_id?: string | null;
          status?: Database["public"]["Enums"]["return_status"];
          reason: Database["public"]["Enums"]["return_reason"];
          customer_note?: string | null;
          resolution?: string;
          refund_amount?: number | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          pickup_shipment_id?: string | null;
          received_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rma_number?: string;
          order_id?: string;
          user_id?: string | null;
          status?: Database["public"]["Enums"]["return_status"];
          reason?: Database["public"]["Enums"]["return_reason"];
          customer_note?: string | null;
          resolution?: string;
          refund_amount?: number | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          pickup_shipment_id?: string | null;
          received_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "return_requests_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "return_requests_pickup_shipment_id_fkey"; columns: ["pickup_shipment_id"]; isOneToOne: false; referencedRelation: "shipments"; referencedColumns: ["id"] },
          { foreignKeyName: "return_requests_reviewed_by_fkey"; columns: ["reviewed_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "return_requests_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      review_media: {
        Row: {
          id: string;
          review_id: string;
          storage_path: string | null;
          url: string | null;
          alt: string;
          mime_type: string | null;
          width: number | null;
          height: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          storage_path?: string | null;
          url?: string | null;
          alt?: string;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          storage_path?: string | null;
          url?: string | null;
          alt?: string;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "review_media_review_id_fkey"; columns: ["review_id"]; isOneToOne: false; referencedRelation: "reviews"; referencedColumns: ["id"] },
        ];
      };
      review_votes: {
        Row: {
          review_id: string;
          user_id: string;
          is_helpful: boolean;
          created_at: string;
        };
        Insert: {
          review_id: string;
          user_id: string;
          is_helpful: boolean;
          created_at?: string;
        };
        Update: {
          review_id?: string;
          user_id?: string;
          is_helpful?: boolean;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "review_votes_review_id_fkey"; columns: ["review_id"]; isOneToOne: false; referencedRelation: "reviews"; referencedColumns: ["id"] },
          { foreignKeyName: "review_votes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string | null;
          order_item_id: string | null;
          rating: number;
          title: string;
          body: string;
          author_name: string;
          author_location: string | null;
          source: Database["public"]["Enums"]["review_source"];
          status: Database["public"]["Enums"]["review_status"];
          verified_purchase: boolean;
          helpful_count: number;
          not_helpful_count: number;
          moderated_by: string | null;
          moderated_at: string | null;
          moderation_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id?: string | null;
          order_item_id?: string | null;
          rating: number;
          title?: string;
          body?: string;
          author_name: string;
          author_location?: string | null;
          source?: Database["public"]["Enums"]["review_source"];
          status?: Database["public"]["Enums"]["review_status"];
          verified_purchase?: boolean;
          helpful_count?: number;
          not_helpful_count?: number;
          moderated_by?: string | null;
          moderated_at?: string | null;
          moderation_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          user_id?: string | null;
          order_item_id?: string | null;
          rating?: number;
          title?: string;
          body?: string;
          author_name?: string;
          author_location?: string | null;
          source?: Database["public"]["Enums"]["review_source"];
          status?: Database["public"]["Enums"]["review_status"];
          verified_purchase?: boolean;
          helpful_count?: number;
          not_helpful_count?: number;
          moderated_by?: string | null;
          moderated_at?: string | null;
          moderation_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "reviews_moderated_by_fkey"; columns: ["moderated_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "reviews_order_item_id_fkey"; columns: ["order_item_id"]; isOneToOne: false; referencedRelation: "order_items"; referencedColumns: ["id"] },
          { foreignKeyName: "reviews_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
          { foreignKeyName: "reviews_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      role_permissions: {
        Row: {
          role: Database["public"]["Enums"]["user_role"];
          permission: string;
          created_at: string;
        };
        Insert: {
          role: Database["public"]["Enums"]["user_role"];
          permission: string;
          created_at?: string;
        };
        Update: {
          role?: Database["public"]["Enums"]["user_role"];
          permission?: string;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "role_permissions_permission_fkey"; columns: ["permission"]; isOneToOne: false; referencedRelation: "permissions"; referencedColumns: ["code"] },
        ];
      };
      seo_overrides: {
        Row: {
          id: string;
          path: string;
          title: string | null;
          description: string | null;
          og_title: string | null;
          og_description: string | null;
          og_image_url: string | null;
          canonical_url: string | null;
          noindex: boolean;
          nofollow: boolean;
          json_ld: Json | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          path: string;
          title?: string | null;
          description?: string | null;
          og_title?: string | null;
          og_description?: string | null;
          og_image_url?: string | null;
          canonical_url?: string | null;
          noindex?: boolean;
          nofollow?: boolean;
          json_ld?: Json | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          path?: string;
          title?: string | null;
          description?: string | null;
          og_title?: string | null;
          og_description?: string | null;
          og_image_url?: string | null;
          canonical_url?: string | null;
          noindex?: boolean;
          nofollow?: boolean;
          json_ld?: Json | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "seo_overrides_updated_by_fkey"; columns: ["updated_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      shipment_events: {
        Row: {
          id: string;
          shipment_id: string;
          status: Database["public"]["Enums"]["shipment_status"];
          provider_status: string | null;
          location: string | null;
          note: string | null;
          occurred_at: string;
          provider_event_id: string | null;
          raw: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          status: Database["public"]["Enums"]["shipment_status"];
          provider_status?: string | null;
          location?: string | null;
          note?: string | null;
          occurred_at: string;
          provider_event_id?: string | null;
          raw?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shipment_id?: string;
          status?: Database["public"]["Enums"]["shipment_status"];
          provider_status?: string | null;
          location?: string | null;
          note?: string | null;
          occurred_at?: string;
          provider_event_id?: string | null;
          raw?: Json | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "shipment_events_shipment_id_fkey"; columns: ["shipment_id"]; isOneToOne: false; referencedRelation: "shipments"; referencedColumns: ["id"] },
        ];
      };
      shipment_items: {
        Row: {
          shipment_id: string;
          order_item_id: string;
          quantity: number;
        };
        Insert: {
          shipment_id: string;
          order_item_id: string;
          quantity: number;
        };
        Update: {
          shipment_id?: string;
          order_item_id?: string;
          quantity?: number;
        };
        Relationships: [
          { foreignKeyName: "shipment_items_order_item_id_fkey"; columns: ["order_item_id"]; isOneToOne: false; referencedRelation: "order_items"; referencedColumns: ["id"] },
          { foreignKeyName: "shipment_items_shipment_id_fkey"; columns: ["shipment_id"]; isOneToOne: false; referencedRelation: "shipments"; referencedColumns: ["id"] },
        ];
      };
      shipments: {
        Row: {
          id: string;
          order_id: string;
          direction: string;
          return_request_id: string | null;
          provider: string;
          provider_order_id: string | null;
          provider_shipment_id: string | null;
          awb: string | null;
          courier_name: string | null;
          courier_code: string | null;
          tracking_url: string | null;
          status: Database["public"]["Enums"]["shipment_status"];
          eta: string | null;
          label_url: string | null;
          manifest_url: string | null;
          weight_grams: number | null;
          dimensions_cm: Json | null;
          shipped_at: string | null;
          delivered_at: string | null;
          last_synced_at: string | null;
          raw: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          direction?: string;
          return_request_id?: string | null;
          provider?: string;
          provider_order_id?: string | null;
          provider_shipment_id?: string | null;
          awb?: string | null;
          courier_name?: string | null;
          courier_code?: string | null;
          tracking_url?: string | null;
          status?: Database["public"]["Enums"]["shipment_status"];
          eta?: string | null;
          label_url?: string | null;
          manifest_url?: string | null;
          weight_grams?: number | null;
          dimensions_cm?: Json | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          last_synced_at?: string | null;
          raw?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          direction?: string;
          return_request_id?: string | null;
          provider?: string;
          provider_order_id?: string | null;
          provider_shipment_id?: string | null;
          awb?: string | null;
          courier_name?: string | null;
          courier_code?: string | null;
          tracking_url?: string | null;
          status?: Database["public"]["Enums"]["shipment_status"];
          eta?: string | null;
          label_url?: string | null;
          manifest_url?: string | null;
          weight_grams?: number | null;
          dimensions_cm?: Json | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          last_synced_at?: string | null;
          raw?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "shipments_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "shipments_return_request_fk"; columns: ["return_request_id"]; isOneToOne: false; referencedRelation: "return_requests"; referencedColumns: ["id"] },
        ];
      };
      shipping_methods: {
        Row: {
          id: string;
          zone_id: string;
          code: string;
          name: string;
          description: string | null;
          rate: number;
          free_above: number | null;
          cod_available: boolean;
          min_days: number;
          max_days: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          zone_id: string;
          code: string;
          name: string;
          description?: string | null;
          rate: number;
          free_above?: number | null;
          cod_available?: boolean;
          min_days?: number;
          max_days?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          zone_id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          rate?: number;
          free_above?: number | null;
          cod_available?: boolean;
          min_days?: number;
          max_days?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "shipping_methods_zone_id_fkey"; columns: ["zone_id"]; isOneToOne: false; referencedRelation: "shipping_zones"; referencedColumns: ["id"] },
        ];
      };
      shipping_zones: {
        Row: {
          id: string;
          name: string;
          states: string[];
          is_default: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          states?: string[];
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          states?: string[];
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
        ];
      };
      staff_members: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          full_name: string | null;
          role: Database["public"]["Enums"]["user_role"];
          status: Database["public"]["Enums"]["staff_status"];
          invited_by: string | null;
          invited_at: string;
          activated_at: string | null;
          suspended_at: string | null;
          suspended_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          full_name?: string | null;
          role: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["staff_status"];
          invited_by?: string | null;
          invited_at?: string;
          activated_at?: string | null;
          suspended_at?: string | null;
          suspended_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string;
          full_name?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["staff_status"];
          invited_by?: string | null;
          invited_at?: string;
          activated_at?: string | null;
          suspended_at?: string | null;
          suspended_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "staff_members_invited_by_fkey"; columns: ["invited_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "staff_members_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      store_settings: {
        Row: {
          id: boolean;
          store_name: string;
          currency: string;
          locale: string;
          timezone: string;
          tax_percentage: number;
          tax_inclusive: boolean;
          gst_number: string | null;
          free_shipping_threshold: number | null;
          flat_shipping_fee: number;
          cod_enabled: boolean;
          cod_fee: number;
          cod_max_order_amount: number | null;
          return_window_days: number;
          reservation_ttl_minutes: number;
          low_stock_default: number;
          support_email: string | null;
          support_phone: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          store_name?: string;
          currency?: string;
          locale?: string;
          timezone?: string;
          tax_percentage?: number;
          tax_inclusive?: boolean;
          gst_number?: string | null;
          free_shipping_threshold?: number | null;
          flat_shipping_fee?: number;
          cod_enabled?: boolean;
          cod_fee?: number;
          cod_max_order_amount?: number | null;
          return_window_days?: number;
          reservation_ttl_minutes?: number;
          low_stock_default?: number;
          support_email?: string | null;
          support_phone?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          store_name?: string;
          currency?: string;
          locale?: string;
          timezone?: string;
          tax_percentage?: number;
          tax_inclusive?: boolean;
          gst_number?: string | null;
          free_shipping_threshold?: number | null;
          flat_shipping_fee?: number;
          cod_enabled?: boolean;
          cod_fee?: number;
          cod_max_order_amount?: number | null;
          return_window_days?: number;
          reservation_ttl_minutes?: number;
          low_stock_default?: number;
          support_email?: string | null;
          support_phone?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "store_settings_updated_by_fkey"; columns: ["updated_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      support_ticket_messages: {
        Row: {
          id: string;
          ticket_id: string;
          author_id: string | null;
          author_type: string;
          body: string;
          is_internal: boolean;
          attachments: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_id?: string | null;
          author_type: string;
          body: string;
          is_internal?: boolean;
          attachments?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          author_id?: string | null;
          author_type?: string;
          body?: string;
          is_internal?: boolean;
          attachments?: Json;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "support_ticket_messages_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "support_ticket_messages_ticket_id_fkey"; columns: ["ticket_id"]; isOneToOne: false; referencedRelation: "support_tickets"; referencedColumns: ["id"] },
        ];
      };
      support_tickets: {
        Row: {
          id: string;
          ticket_number: string;
          user_id: string | null;
          email: string;
          order_id: string | null;
          payment_id: string | null;
          subject: string;
          category: string;
          status: Database["public"]["Enums"]["ticket_status"];
          priority: Database["public"]["Enums"]["ticket_priority"];
          channel: string;
          assigned_to: string | null;
          first_response_at: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_number?: string;
          user_id?: string | null;
          email: string;
          order_id?: string | null;
          payment_id?: string | null;
          subject: string;
          category?: string;
          status?: Database["public"]["Enums"]["ticket_status"];
          priority?: Database["public"]["Enums"]["ticket_priority"];
          channel?: string;
          assigned_to?: string | null;
          first_response_at?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ticket_number?: string;
          user_id?: string | null;
          email?: string;
          order_id?: string | null;
          payment_id?: string | null;
          subject?: string;
          category?: string;
          status?: Database["public"]["Enums"]["ticket_status"];
          priority?: Database["public"]["Enums"]["ticket_priority"];
          channel?: string;
          assigned_to?: string | null;
          first_response_at?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "support_tickets_assigned_to_fkey"; columns: ["assigned_to"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "support_tickets_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "support_tickets_payment_id_fkey"; columns: ["payment_id"]; isOneToOne: false; referencedRelation: "payments"; referencedColumns: ["id"] },
          { foreignKeyName: "support_tickets_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      testimonials: {
        Row: {
          id: string;
          author_name: string;
          author_role: string | null;
          quote: string;
          avatar_url: string | null;
          rating: number | null;
          product_id: string | null;
          is_published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_name: string;
          author_role?: string | null;
          quote: string;
          avatar_url?: string | null;
          rating?: number | null;
          product_id?: string | null;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_name?: string;
          author_role?: string | null;
          quote?: string;
          avatar_url?: string | null;
          rating?: number | null;
          product_id?: string | null;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "testimonials_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ];
      };
      visitor_sessions: {
        Row: {
          id: string;
          anonymous_id: string;
          user_id: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_term: string | null;
          utm_content: string | null;
          referrer: string | null;
          landing_path: string | null;
          device_type: string | null;
          os: string | null;
          browser: string | null;
          country: string | null;
          region: string | null;
          city: string | null;
          ip_hash: string | null;
          user_agent: string | null;
          page_views: number;
          first_seen_at: string;
          last_seen_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          anonymous_id: string;
          user_id?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_term?: string | null;
          utm_content?: string | null;
          referrer?: string | null;
          landing_path?: string | null;
          device_type?: string | null;
          os?: string | null;
          browser?: string | null;
          country?: string | null;
          region?: string | null;
          city?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          page_views?: number;
          first_seen_at?: string;
          last_seen_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          anonymous_id?: string;
          user_id?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_term?: string | null;
          utm_content?: string | null;
          referrer?: string | null;
          landing_path?: string | null;
          device_type?: string | null;
          os?: string | null;
          browser?: string | null;
          country?: string | null;
          region?: string | null;
          city?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          page_views?: number;
          first_seen_at?: string;
          last_seen_at?: string;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "visitor_sessions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      wishlist_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          variant_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          variant_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          variant_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "wishlist_items_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
          { foreignKeyName: "wishlist_items_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "wishlist_items_variant_id_fkey"; columns: ["variant_id"]; isOneToOne: false; referencedRelation: "product_variants"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      admin_upsert_product: { Args: { p_doc: Json }; Returns: Json };
      adjust_inventory: { Args: { p_variant_id: string; p_delta: number; p_reason?: Database["public"]["Enums"]["inventory_reason"]; p_note?: string; p_reference_type?: string; p_reference_id?: string }; Returns: Database["public"]["Tables"]["inventory"]["Row"] };
      apply_coupon: { Args: { p_cart_id: string; p_code: string }; Returns: Json };
      auth_role: { Args: Record<PropertyKey, never>; Returns: Database["public"]["Enums"]["user_role"] };
      bootstrap_super_admin: { Args: { p_email: string }; Returns: string };
      cancel_order: { Args: { p_order_id: string; p_reason?: string }; Returns: Json };
      category_descendants: { Args: { p_category_id: string }; Returns: string[] };
      category_path: { Args: { p_category_id: string }; Returns: string[] };
      commit_order_inventory: { Args: { p_order_id: string }; Returns: number };
      compute_pricing: { Args: { p_items: Json; p_coupon_code?: string; p_user_id?: string; p_email?: string; p_shipping_method_id?: string; p_payment_provider?: Database["public"]["Enums"]["payment_provider"]; p_state?: string; p_lock?: boolean }; Returns: Json };
      confirm_order_side_effects: { Args: { p_order_id: string }; Returns: undefined };
      custom_access_token_hook: { Args: { event: Json }; Returns: Json };
      discount_target_match: { Args: { p_coupon_id: string; p_offer_id: string; p_product_id: string; p_variant_id: string; p_category_path: string[]; p_collection_ids: string[] }; Returns: boolean };
      get_customer_journey: { Args: { p_user_id: string; p_limit?: number }; Returns: { occurred_at: string; kind: string; summary: string; ref_id: string; detail: Json }[] };
      get_order_tracking: { Args: { p_token: string }; Returns: Json };
      has_permission: { Args: { p_permission: string }; Returns: boolean };
      immutable_array_to_string: { Args: { p_arr: string[] }; Returns: string };
      is_service_role: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      mark_payment_captured: { Args: { p_order_id: string; p_attempt_id: string; p_provider_payment_id: string; p_amount: number; p_method?: Database["public"]["Enums"]["payment_method"]; p_raw?: Json; p_method_details?: Json }; Returns: Json };
      order_json: { Args: { o: Database["public"]["Tables"]["orders"]["Row"] }; Returns: Json };
      order_status_allowed: { Args: { p_from: Database["public"]["Enums"]["order_status"]; p_to: Database["public"]["Enums"]["order_status"] }; Returns: boolean };
      place_order: { Args: { p_idempotency_key: string; p_payload: Json }; Returns: Json };
      publish_scheduled_posts: { Args: Record<PropertyKey, never>; Returns: number };
      quote_cart: { Args: { p_cart_id: string; p_shipping_method_id?: string; p_payment_provider?: Database["public"]["Enums"]["payment_provider"]; p_state?: string }; Returns: Json };
      reconcile_order_payment: { Args: { p_order_id: string }; Returns: Json };
      record_payment_failure: { Args: { p_attempt_id: string; p_stage: Database["public"]["Enums"]["payment_failure_stage"]; p_code?: string; p_reason?: string; p_source?: string; p_raw?: Json; p_provider_payment_id?: string }; Returns: Json };
      release_expired_reservations: { Args: Record<PropertyKey, never>; Returns: number };
      release_inventory: { Args: { p_reservation_id: string; p_status?: Database["public"]["Enums"]["reservation_status"] }; Returns: boolean };
      release_order_inventory: { Args: { p_order_id: string; p_status?: Database["public"]["Enums"]["reservation_status"] }; Returns: number };
      reserve_inventory: { Args: { p_variant_id: string; p_quantity: number; p_order_id?: string; p_checkout_session_id?: string; p_ttl?: string }; Returns: string };
      restock_return: { Args: { p_return_request_id: string }; Returns: number };
      start_payment_attempt: { Args: { p_order_id: string; p_provider: Database["public"]["Enums"]["payment_provider"]; p_provider_order_id?: string; p_method?: Database["public"]["Enums"]["payment_method"]; p_raw_request?: Json; p_client_ip?: string; p_user_agent?: string }; Returns: Json };
      variant_options: { Args: { p_variant_id: string }; Returns: Json };
    };
    Enums: {
      account_status: "active" | "blocked" | "deleted";
      analytics_event_name: "page_view" | "search_submitted" | "product_viewed" | "category_viewed" | "collection_viewed" | "add_to_cart" | "remove_from_cart" | "wishlist_added" | "checkout_started" | "payment_initiated" | "payment_succeeded" | "payment_failed" | "order_created" | "shipment_created" | "order_delivered" | "return_requested" | "review_submitted" | "coupon_applied" | "campaign_viewed" | "home_section_clicked";
      blog_status: "draft" | "scheduled" | "published" | "archived";
      campaign_status: "draft" | "scheduled" | "live" | "paused" | "completed" | "archived";
      cart_status: "active" | "converted" | "merged" | "abandoned";
      checkout_status: "open" | "payment_pending" | "completed" | "expired" | "abandoned";
      content_status: "draft" | "published" | "archived";
      coupon_status: "draft" | "active" | "paused" | "expired" | "archived";
      coupon_type: "percent" | "fixed" | "free_shipping";
      gateway_mode: "test" | "live";
      home_section_type: "hero_carousel" | "category_grid" | "collection_rail" | "product_carousel" | "floating_showcase" | "promo_banner" | "testimonials" | "blog_rail" | "newsletter" | "tear_reveal";
      integration_status: "connected" | "needs_attention" | "disconnected";
      inventory_reason: "initial" | "restock" | "adjustment" | "reservation" | "release" | "sale" | "cancellation" | "return" | "damage" | "correction";
      notification_status: "queued" | "sent" | "delivered" | "bounced" | "failed" | "complained";
      offer_type: "bundle_fixed_price" | "bogo" | "tiered_percent";
      order_status: "pending_payment" | "paid" | "processing" | "packed" | "shipped" | "delivered" | "cancelled" | "return_requested" | "returned" | "refunded";
      payment_attempt_status: "created" | "checkout_opened" | "pending" | "authorized" | "captured" | "failed" | "cancelled" | "duplicate";
      payment_failure_stage: "order_creation" | "checkout_open" | "user_cancelled" | "bank_declined" | "otp_timeout" | "insufficient_funds" | "signature_mismatch" | "amount_mismatch" | "webhook_timeout" | "capture_failed" | "gateway_error" | "risk_blocked" | "network_error" | "unknown";
      payment_method: "card" | "upi" | "netbanking" | "wallet" | "emi" | "paylater" | "cod";
      payment_provider: "razorpay" | "payu" | "cod";
      payment_status: "initiated" | "authorized" | "captured" | "failed" | "refunded" | "partially_refunded";
      product_status: "draft" | "published" | "unpublished" | "archived";
      redemption_status: "reserved" | "applied" | "reversed";
      refund_status: "pending" | "processing" | "processed" | "failed";
      reservation_status: "active" | "released" | "consumed" | "expired";
      return_reason: "size_too_small" | "size_too_large" | "defective" | "damaged_in_transit" | "wrong_item" | "missing_parts" | "not_as_described" | "changed_mind" | "other";
      return_status: "requested" | "approved" | "rejected" | "pickup_scheduled" | "received" | "refunded" | "closed";
      review_source: "customer" | "admin" | "import";
      review_status: "pending" | "approved" | "rejected" | "hidden";
      shipment_status: "created" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "exception" | "cancelled";
      staff_status: "invited" | "active" | "suspended";
      target_mode: "include" | "exclude";
      ticket_priority: "low" | "normal" | "high" | "urgent";
      ticket_status: "open" | "pending_customer" | "pending_internal" | "resolved" | "closed";
      user_role: "customer" | "super_admin" | "catalog_manager" | "order_manager" | "marketing_manager" | "analyst" | "support_agent";
      variant_status: "active" | "out_of_stock" | "disabled";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
export type Functions<T extends keyof PublicSchema["Functions"]> = PublicSchema["Functions"][T];
