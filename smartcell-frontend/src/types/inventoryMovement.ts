/** Respuesta del API (InventoryMovementResource) */
export type ApiInventoryMovement = {
    id: number;
    product_id: number;
    product?: {
        id: number;
        code: string;
        name: string;
        quantity?: number;
    };
    type: InventoryMovementType;
    quantity: number;
    reason: InventoryMovementReason;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
};

export const INVENTORY_MOVEMENT_TYPE = {
    ENTRADA: 'entrada',
    SALIDA: 'salida',
} as const;

export type InventoryMovementType = (typeof INVENTORY_MOVEMENT_TYPE)[keyof typeof INVENTORY_MOVEMENT_TYPE];

export const INVENTORY_MOVEMENT_TYPE_LABELS: Record<InventoryMovementType, string> = {
    [INVENTORY_MOVEMENT_TYPE.ENTRADA]: 'Entrada',
    [INVENTORY_MOVEMENT_TYPE.SALIDA]: 'Salida',
};

export const INVENTORY_MOVEMENT_REASON = {
    VENTA: 'venta',
    COMPRA: 'compra',
    USO_TECNICO: 'uso_tecnico',
    STOCK_INICIAL: 'stock_inicial',
    AJUSTE_POSITIVO: 'ajuste_positivo',
    AJUSTE_NEGATIVO: 'ajuste_negativo',
} as const;

export type InventoryMovementReason = (typeof INVENTORY_MOVEMENT_REASON)[keyof typeof INVENTORY_MOVEMENT_REASON];

export const INVENTORY_MOVEMENT_REASON_LABELS: Record<InventoryMovementReason, string> = {
    venta: 'Venta',
    compra: 'Compra',
    uso_tecnico: 'Uso técnico',
    stock_inicial: 'Stock inicial',
    ajuste_positivo: 'Ajuste (+)',
    ajuste_negativo: 'Ajuste (-)',
};

/** Fila normalizada para la tabla de movimientos */
export type InventoryMovementTableRow = {
    id: number;
    producto: string;
    sku: string;
    tipo: InventoryMovementType;
    cantidad: number;
    motivo: InventoryMovementReason;
    fecha: string;
    _raw: ApiInventoryMovement;
};

export type InventoryMovementPayload = {
    product_id: number;
    type: InventoryMovementType;
    quantity: number;
    reason: InventoryMovementReason;
};

export type PaginatedInventoryMovementsResponse = {
    data: ApiInventoryMovement[];
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
};

export type LaravelPaginationMeta = {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
};