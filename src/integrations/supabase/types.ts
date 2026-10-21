export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          landmark: string | null
          line1: string
          phone: string
          pincode: string
          state: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          landmark?: string | null
          line1: string
          phone: string
          pincode: string
          state: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          landmark?: string | null
          line1?: string
          phone?: string
          pincode?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          product_id: string
          quantity: number
          updated_at?: string
          user_id: string
        }
        Update: {
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort: number
        }
        Insert: {
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort?: number
        }
        Update: {
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          image: string | null
          name: string
          order_id: string
          price: number
          product_id: string | null
          quantity: number
        }
        Insert: {
          id?: string
          image?: string | null
          name: string
          order_id: string
          price: number
          product_id?: string | null
          quantity: number
        }
        Update: {
          id?: string
          image?: string | null
          name?: string
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          contact: Json
          courier: string | null
          created_at: string
          id: string
          order_number: string
          paid_at: string | null
          payment_method: string
          payment_status: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          shipping: number
          shipping_address: Json
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact: Json
          courier?: string | null
          created_at?: string
          id?: string
          order_number?: string
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          shipping: number
          shipping_address: Json
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact?: Json
          courier?: string | null
          created_at?: string
          id?: string
          order_number?: string
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          shipping?: number
          shipping_address?: Json
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          archived: boolean
          bestseller: boolean
          burn_time: string | null
          category_id: string | null
          created_at: string
          description: string | null
          featured: boolean
          id: string
          images: string[]
          low_stock_threshold: number
          name: string
          price: number
          scent_notes: string[]
          short_description: string | null
          size: string | null
          slug: string
          stock: number
        }
        Insert: {
          archived?: boolean
          bestseller?: boolean
          burn_time?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          low_stock_threshold?: number
          name: string
          price: number
          scent_notes?: string[]
          short_description?: string | null
          size?: string | null
          slug: string
          stock?: number
        }
        Update: {
          archived?: boolean
          bestseller?: boolean
          burn_time?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          low_stock_threshold?: number
          name?: string
          price?: number
          scent_notes?: string[]
          short_description?: string | null
          size?: string | null
          slug?: string
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          instagram: string | null
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          instagram?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          instagram?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_adjustments: {
        Row: {
          change: number
          changed_by: string | null
          created_at: string
          id: string
          new_stock: number
          note: string | null
          order_id: string | null
          product_id: string
          reason: string
        }
        Insert: {
          change: number
          changed_by?: string | null
          created_at?: string
          id?: string
          new_stock: number
          note?: string | null
          order_id?: string | null
          product_id: string
          reason: string
        }
        Update: {
          change?: number
          changed_by?: string | null
          created_at?: string
          id?: string
          new_stock?: number
          note?: string | null
          order_id?: string | null
          product_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_stock: {
        Args: {
          _change: number
          _note?: string
          _product_id: string
          _reason: string
        }
        Returns: number
      }
      admin_set_role: {
        Args: {
          _email: string
          _grant: boolean
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      admin_team: {
        Args: never
        Returns: {
          email: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      admin_update_order: {
        Args: {
          _courier?: string
          _note?: string
          _order_id: string
          _status: Database["public"]["Enums"]["order_status"]
          _tracking?: string
        }
        Returns: undefined
      }
      cancel_order: { Args: { _order_id: string }; Returns: undefined }
      claim_owner: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      place_order: {
        Args: { _address: Json; _contact: Json; _items: Json }
        Returns: Json
      }
      store_has_owner: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "staff" | "customer"
      order_status:
        | "placed"
        | "confirmed"
        | "packed"
        | "shipped"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "staff", "customer"],
      order_status: [
        "placed",
        "confirmed",
        "packed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
