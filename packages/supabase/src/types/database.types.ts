export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          query?: string
          extensions?: Json
          variables?: Json
          operationName?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      compiled_artifacts: {
        Row: {
          artifacts: Json
          compilation_time_ms: number | null
          compiler_version: string | null
          created_at: string | null
          id: string
          instance_id: string
        }
        Insert: {
          artifacts: Json
          compilation_time_ms?: number | null
          compiler_version?: string | null
          created_at?: string | null
          id?: string
          instance_id: string
        }
        Update: {
          artifacts?: Json
          compilation_time_ms?: number | null
          compiler_version?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compiled_artifacts_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "contract_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_instances: {
        Row: {
          compilation_error: string | null
          created_at: string | null
          deployed_with_wallet_id: string | null
          description: string | null
          id: string
          name: string
          parameters: Json
          source_code: string
          status: string
          template_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          compilation_error?: string | null
          created_at?: string | null
          deployed_with_wallet_id?: string | null
          description?: string | null
          id?: string
          name: string
          parameters: Json
          source_code: string
          status?: string
          template_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          compilation_error?: string | null
          created_at?: string | null
          deployed_with_wallet_id?: string | null
          description?: string | null
          id?: string
          name?: string
          parameters?: Json
          source_code?: string
          status?: string
          template_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_instances_deployed_with_wallet_id_fkey"
            columns: ["deployed_with_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          source_code: string
          tags: string[] | null
          updated_at: string | null
          version: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          source_code: string
          tags?: string[] | null
          updated_at?: string | null
          version?: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          source_code?: string
          tags?: string[] | null
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      deployments: {
        Row: {
          contract_address: string
          contract_instance_id: string
          deployed_at: string | null
          error_message: string | null
          id: string
          status: string
          transaction_hash: string
          wallet_id: string
        }
        Insert: {
          contract_address: string
          contract_instance_id: string
          deployed_at?: string | null
          error_message?: string | null
          id?: string
          status: string
          transaction_hash: string
          wallet_id: string
        }
        Update: {
          contract_address?: string
          contract_instance_id?: string
          deployed_at?: string | null
          error_message?: string | null
          id?: string
          status?: string
          transaction_hash?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployments_contract_instance_id_fkey"
            columns: ["contract_instance_id"]
            isOneToOne: false
            referencedRelation: "contract_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployments_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      parameter_definitions: {
        Row: {
          created_at: string | null
          data_type: string
          default_value: string | null
          description: string | null
          display_order: number | null
          id: string
          is_required: boolean | null
          parameter_key: string
          parameter_name: string
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          data_type: string
          default_value?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          parameter_key: string
          parameter_name: string
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          data_type?: string
          default_value?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          parameter_key?: string
          parameter_name?: string
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          address: string
          created_at: string
          encrypted_private_key: string
          id: string
          name: string | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          created_at?: string
          encrypted_private_key: string
          id?: string
          name?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          encrypted_private_key?: string
          id?: string
          name?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

