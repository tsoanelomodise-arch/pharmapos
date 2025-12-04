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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      business_settings: {
        Row: {
          address: string | null
          email: string | null
          id: string
          pharmacy_name: string
          phone: string | null
          updated_at: string
          updated_by: string | null
          vat_inclusive: boolean
          vat_number: string | null
          vat_rate: number
        }
        Insert: {
          address?: string | null
          email?: string | null
          id?: string
          pharmacy_name?: string
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_inclusive?: boolean
          vat_number?: string | null
          vat_rate?: number
        }
        Update: {
          address?: string | null
          email?: string | null
          id?: string
          pharmacy_name?: string
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          vat_inclusive?: boolean
          vat_number?: string | null
          vat_rate?: number
        }
        Relationships: []
      }
      customer_access_logs: {
        Row: {
          access_type: string
          accessed_at: string
          customer_id: string
          id: string
          ip_address: string | null
          notes: string | null
          user_id: string
          user_role: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          customer_id: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          user_id: string
          user_role?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          customer_id?: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          user_id?: string
          user_role?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_access_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_access_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          credit_limit: number | null
          current_balance: number | null
          date_of_birth: string | null
          email: string | null
          id: string
          insurance_info: Json | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          date_of_birth?: string | null
          email?: string | null
          id?: string
          insurance_info?: Json | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          date_of_birth?: string | null
          email?: string | null
          id?: string
          insurance_info?: Json | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          created_at: string
          email: string | null
          id: string
          license_number: string | null
          name: string
          phone: string | null
          specialization: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          license_number?: string | null
          name: string
          phone?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          license_number?: string | null
          name?: string
          phone?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          created_at: string
          customer_id: string
          dispensed_at: string | null
          dispensed_by: string | null
          doctor_license: string | null
          doctor_name: string
          id: string
          medications: Json
          notes: string | null
          prescription_date: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          dispensed_at?: string | null
          dispensed_by?: string | null
          doctor_license?: string | null
          doctor_name: string
          id?: string
          medications: Json
          notes?: string | null
          prescription_date: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          dispensed_at?: string | null
          dispensed_by?: string | null
          doctor_license?: string | null
          doctor_name?: string
          id?: string
          medications?: Json
          notes?: string | null
          prescription_date?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          batch_number: string | null
          brand: string | null
          category: Database["public"]["Enums"]["product_category"]
          cost_price: number
          created_at: string
          description: string | null
          expiry_date: string | null
          generic_name: string | null
          id: string
          markup_percentage: number
          minimum_stock: number
          name: string
          requires_prescription: boolean
          stock_quantity: number
          supplier_id: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          batch_number?: string | null
          brand?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          cost_price?: number
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          generic_name?: string | null
          id?: string
          markup_percentage?: number
          minimum_stock?: number
          name: string
          requires_prescription?: boolean
          stock_quantity?: number
          supplier_id?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          batch_number?: string | null
          brand?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          cost_price?: number
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          generic_name?: string | null
          id?: string
          markup_percentage?: number
          minimum_stock?: number
          name?: string
          requires_prescription?: boolean
          stock_quantity?: number
          supplier_id?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cash_paid: number | null
          change_given: number | null
          created_at: string
          customer_id: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: string | null
          prescription_id: string | null
          processed_by: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          cash_paid?: number | null
          change_given?: number | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: string | null
          prescription_id?: string | null
          processed_by?: string | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          cash_paid?: number | null
          change_given?: number | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: string | null
          prescription_id?: string | null
          processed_by?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: Database["public"]["Enums"]["transaction_type"]
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type: Database["public"]["Enums"]["transaction_type"]
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["transaction_type"]
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_module_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          module: Database["public"]["Enums"]["app_module"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          module: Database["public"]["Enums"]["app_module"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          module?: Database["public"]["Enums"]["app_module"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      customers_secure: {
        Row: {
          address: string | null
          created_at: string | null
          credit_limit: number | null
          current_balance: number | null
          date_of_birth: string | null
          email: string | null
          id: string | null
          insurance_info: Json | null
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          credit_limit?: never
          current_balance?: never
          date_of_birth?: string | null
          email?: string | null
          id?: string | null
          insurance_info?: never
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          credit_limit?: never
          current_balance?: never
          date_of_birth?: string | null
          email?: string | null
          id?: string | null
          insurance_info?: never
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_modules: {
        Args: { _user_id: string }
        Returns: {
          module: Database["public"]["Enums"]["app_module"]
        }[]
      }
      has_module_access: {
        Args: {
          _module: Database["public"]["Enums"]["app_module"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_customer_access: {
        Args: { _access_type: string; _customer_id: string; _notes?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_module:
        | "dashboard"
        | "dispensing"
        | "pos"
        | "debtors"
        | "stock"
        | "reports"
        | "management"
        | "help"
        | "patients"
        | "doctors"
        | "orders"
        | "medical_aid"
        | "settings"
        | "edit_transactions"
      app_role: "pharmacist" | "admin" | "manager" | "owner"
      payment_method: "cash" | "card" | "credit" | "insurance"
      product_category:
        | "prescription"
        | "otc"
        | "supplement"
        | "medical_device"
        | "cosmetic"
      transaction_type: "sale" | "return" | "adjustment"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_module: [
        "dashboard",
        "dispensing",
        "pos",
        "debtors",
        "stock",
        "reports",
        "management",
        "help",
        "patients",
        "doctors",
        "orders",
        "medical_aid",
        "settings",
        "edit_transactions",
      ],
      app_role: ["pharmacist", "admin", "manager", "owner"],
      payment_method: ["cash", "card", "credit", "insurance"],
      product_category: [
        "prescription",
        "otc",
        "supplement",
        "medical_device",
        "cosmetic",
      ],
      transaction_type: ["sale", "return", "adjustment"],
    },
  },
} as const
