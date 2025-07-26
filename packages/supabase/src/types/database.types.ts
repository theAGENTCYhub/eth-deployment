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
          variables?: Json
          extensions?: Json
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
      bundle_launches: {
        Row: {
          bundle_hash: string | null
          bundle_timeout: number | null
          bundle_token_percent: number
          bundle_token_percent_per_wallet: number
          bundle_wallet_count: number
          created_at: string
          dev_wallet_address: string
          error_message: string | null
          funding_wallet_address: string
          id: string
          liquidity_eth_amount: string
          liquidity_token_percent: number
          max_fee_per_gas: string | null
          max_gas_price: string | null
          max_priority_fee_per_gas: string | null
          network: string
          short_id: string
          status: string
          target_block: number | null
          token_address: string
          token_name: string
          token_total_supply: string
          total_cost: string | null
          transaction_hashes: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bundle_hash?: string | null
          bundle_timeout?: number | null
          bundle_token_percent: number
          bundle_token_percent_per_wallet: number
          bundle_wallet_count: number
          created_at?: string
          dev_wallet_address: string
          error_message?: string | null
          funding_wallet_address: string
          id?: string
          liquidity_eth_amount: string
          liquidity_token_percent: number
          max_fee_per_gas?: string | null
          max_gas_price?: string | null
          max_priority_fee_per_gas?: string | null
          network: string
          short_id: string
          status?: string
          target_block?: number | null
          token_address: string
          token_name: string
          token_total_supply: string
          total_cost?: string | null
          transaction_hashes?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bundle_hash?: string | null
          bundle_timeout?: number | null
          bundle_token_percent?: number
          bundle_token_percent_per_wallet?: number
          bundle_wallet_count?: number
          created_at?: string
          dev_wallet_address?: string
          error_message?: string | null
          funding_wallet_address?: string
          id?: string
          liquidity_eth_amount?: string
          liquidity_token_percent?: number
          max_fee_per_gas?: string | null
          max_gas_price?: string | null
          max_priority_fee_per_gas?: string | null
          network?: string
          short_id?: string
          status?: string
          target_block?: number | null
          token_address?: string
          token_name?: string
          token_total_supply?: string
          total_cost?: string | null
          transaction_hashes?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bundle_wallets: {
        Row: {
          created_at: string | null
          id: string
          is_funded: boolean | null
          launch_id: string | null
          private_key_encrypted: string
          wallet_address: string
          wallet_index: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_funded?: boolean | null
          launch_id?: string | null
          private_key_encrypted: string
          wallet_address: string
          wallet_index?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_funded?: boolean | null
          launch_id?: string | null
          private_key_encrypted?: string
          wallet_address?: string
          wallet_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bundle_wallets_launch_id_fkey"
            columns: ["launch_id"]
            isOneToOne: false
            referencedRelation: "bundle_launches"
            referencedColumns: ["id"]
          },
        ]
      }
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
          is_active: boolean
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
          is_active?: boolean
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
          is_active?: boolean
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
      launch_configs: {
        Row: {
          bundle_token_percent: number
          bundle_token_percent_per_wallet: number
          bundle_wallet_count: number
          created_at: string | null
          eth_per_wallet: string
          id: string
          liquidity_eth_amount: string
          liquidity_token_percent: number
          name: string
          user_id: string
        }
        Insert: {
          bundle_token_percent: number
          bundle_token_percent_per_wallet: number
          bundle_wallet_count: number
          created_at?: string | null
          eth_per_wallet: string
          id?: string
          liquidity_eth_amount: string
          liquidity_token_percent: number
          name: string
          user_id: string
        }
        Update: {
          bundle_token_percent?: number
          bundle_token_percent_per_wallet?: number
          bundle_wallet_count?: number
          created_at?: string | null
          eth_per_wallet?: string
          id?: string
          liquidity_eth_amount?: string
          liquidity_token_percent?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      liquidity_positions: {
        Row: {
          amount_eth: string
          amount_lp_tokens: string
          amount_token: string
          created_at: string
          id: string
          pair_address: string
          short_id: string
          updated_at: string
          wallet_address: string
        }
        Insert: {
          amount_eth: string
          amount_lp_tokens: string
          amount_token: string
          created_at?: string
          id?: string
          pair_address: string
          short_id: string
          updated_at?: string
          wallet_address: string
        }
        Update: {
          amount_eth?: string
          amount_lp_tokens?: string
          amount_token?: string
          created_at?: string
          id?: string
          pair_address?: string
          short_id?: string
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
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
      positions: {
        Row: {
          amount: string
          average_cost_basis: string | null
          created_at: string
          eth_spent: string | null
          id: string
          launch_id: string | null
          short_id: string
          status: string | null
          token_address: string
          updated_at: string
          wallet_address: string
        }
        Insert: {
          amount: string
          average_cost_basis?: string | null
          created_at?: string
          eth_spent?: string | null
          id?: string
          launch_id?: string | null
          short_id: string
          status?: string | null
          token_address: string
          updated_at?: string
          wallet_address: string
        }
        Update: {
          amount?: string
          average_cost_basis?: string | null
          created_at?: string
          eth_spent?: string | null
          id?: string
          launch_id?: string | null
          short_id?: string
          status?: string | null
          token_address?: string
          updated_at?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_launch_id_fkey"
            columns: ["launch_id"]
            isOneToOne: false
            referencedRelation: "bundle_launches"
            referencedColumns: ["id"]
          },
        ]
      }
      token_launches: {
        Row: {
          amount_eth: string
          amount_token: string
          created_at: string
          id: string
          network: string
          pair_address: string
          short_id: string
          token_address: string
          transaction_id: string | null
          wallet_address: string
        }
        Insert: {
          amount_eth: string
          amount_token: string
          created_at?: string
          id?: string
          network: string
          pair_address: string
          short_id: string
          token_address: string
          transaction_id?: string | null
          wallet_address: string
        }
        Update: {
          amount_eth?: string
          amount_token?: string
          created_at?: string
          id?: string
          network?: string
          pair_address?: string
          short_id?: string
          token_address?: string
          transaction_id?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_launches_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          amount_quote: string
          amount_token: string
          created_at: string
          id: string
          position_id: string | null
          price: string
          short_id: string
          token_address: string
          transaction_id: string | null
          type: string
          wallet_address: string
        }
        Insert: {
          amount_quote: string
          amount_token: string
          created_at?: string
          id?: string
          position_id?: string | null
          price: string
          short_id: string
          token_address: string
          transaction_id?: string | null
          type: string
          wallet_address: string
        }
        Update: {
          amount_quote?: string
          amount_token?: string
          created_at?: string
          id?: string
          position_id?: string | null
          price?: string
          short_id?: string
          token_address?: string
          transaction_id?: string | null
          type?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          block_number: number | null
          created_at: string
          error_message: string | null
          gas_price: string | null
          gas_used: string | null
          id: string
          metadata: Json | null
          short_id: string | null
          status: string
          transaction_hash: string | null
          type: string
          wallet_address: string
        }
        Insert: {
          block_number?: number | null
          created_at?: string
          error_message?: string | null
          gas_price?: string | null
          gas_used?: string | null
          id?: string
          metadata?: Json | null
          short_id?: string | null
          status: string
          transaction_hash?: string | null
          type: string
          wallet_address: string
        }
        Update: {
          block_number?: number | null
          created_at?: string
          error_message?: string | null
          gas_price?: string | null
          gas_used?: string | null
          id?: string
          metadata?: Json | null
          short_id?: string | null
          status?: string
          transaction_hash?: string | null
          type?: string
          wallet_address?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          address: string
          created_at: string
          encrypted_private_key: string
          id: string
          is_active: boolean
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
          is_active?: boolean
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
          is_active?: boolean
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

