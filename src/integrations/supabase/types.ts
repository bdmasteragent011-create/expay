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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          id: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          activation_code: string
          agent_id: string
          auth_user_id: string | null
          available_credits: number | null
          commission_balance: number | null
          created_at: string
          district: string | null
          email: string
          id: string
          is_banned: boolean | null
          max_credit: number | null
          name: string
          phone: string | null
          total_pay_in: number | null
          total_pay_out: number | null
          updated_at: string
        }
        Insert: {
          activation_code: string
          agent_id: string
          auth_user_id?: string | null
          available_credits?: number | null
          commission_balance?: number | null
          created_at?: string
          district?: string | null
          email: string
          id?: string
          is_banned?: boolean | null
          max_credit?: number | null
          name: string
          phone?: string | null
          total_pay_in?: number | null
          total_pay_out?: number | null
          updated_at?: string
        }
        Update: {
          activation_code?: string
          agent_id?: string
          auth_user_id?: string | null
          available_credits?: number | null
          commission_balance?: number | null
          created_at?: string
          district?: string | null
          email?: string
          id?: string
          is_banned?: boolean | null
          max_credit?: number | null
          name?: string
          phone?: string | null
          total_pay_in?: number | null
          total_pay_out?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      deposit_methods: {
        Row: {
          created_at: string
          id: string
          instructions: string | null
          is_active: boolean | null
          name: string
          number: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name: string
          number?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name?: string
          number?: string | null
        }
        Relationships: []
      }
      deposit_requests: {
        Row: {
          agent_id: string
          amount_bdt: number
          amount_usdt: number
          created_at: string
          id: string
          method_id: string | null
          status: Database["public"]["Enums"]["deposit_status"] | null
          transaction_id: string | null
        }
        Insert: {
          agent_id: string
          amount_bdt: number
          amount_usdt: number
          created_at?: string
          id?: string
          method_id?: string | null
          status?: Database["public"]["Enums"]["deposit_status"] | null
          transaction_id?: string | null
        }
        Update: {
          agent_id?: string
          amount_bdt?: number
          amount_usdt?: number
          created_at?: string
          id?: string
          method_id?: string | null
          status?: Database["public"]["Enums"]["deposit_status"] | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposit_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_requests_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "deposit_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          agent_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean | null
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          dollar_rate: number | null
          id: string
          live_chat_link: string | null
          maintenance_mode: boolean | null
          site_title: string | null
          telegram_link: string | null
          updated_at: string
        }
        Insert: {
          dollar_rate?: number | null
          id?: string
          live_chat_link?: string | null
          maintenance_mode?: boolean | null
          site_title?: string | null
          telegram_link?: string | null
          updated_at?: string
        }
        Update: {
          dollar_rate?: number | null
          id?: string
          live_chat_link?: string | null
          maintenance_mode?: boolean | null
          site_title?: string | null
          telegram_link?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          agent_id: string
          amount: number
          created_at: string
          id: string
          method_name: string | null
          method_number: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          transaction_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          agent_id: string
          amount: number
          created_at?: string
          id?: string
          method_name?: string | null
          method_number?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          transaction_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          agent_id?: string
          amount?: number
          created_at?: string
          id?: string
          method_name?: string | null
          method_number?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          transaction_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          agent_id: string
          balance: number | null
          created_at: string
          id: string
          is_active: boolean | null
          wallet_name: string | null
          wallet_number: string
        }
        Insert: {
          agent_id: string
          balance?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          wallet_name?: string | null
          wallet_number: string
        }
        Update: {
          agent_id?: string
          balance?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          wallet_name?: string | null
          wallet_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      deposit_status: "processing" | "approved" | "rejected"
      transaction_status: "pending" | "accepted" | "rejected"
      transaction_type: "pay_in" | "pay_out"
      user_role: "admin" | "agent"
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
      deposit_status: ["processing", "approved", "rejected"],
      transaction_status: ["pending", "accepted", "rejected"],
      transaction_type: ["pay_in", "pay_out"],
      user_role: ["admin", "agent"],
    },
  },
} as const
