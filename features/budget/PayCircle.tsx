import { Tooltip, UnstyledButton } from '@mantine/core';

// Кружок слева от неоплаченной статьи: клик открывает оплату. Синий при частичной оплате, пунктирный иначе
export function PayCircle({ partial, label, onClick }: { partial: boolean; label: string; onClick: () => void }) {
  return (
    <Tooltip label="Оплатить">
      <UnstyledButton
        onClick={onClick}
        aria-label={label}
        style={{
          width: 20,
          height: 20,
          flexShrink: 0,
          borderRadius: '50%',
          border: partial
            ? '2px solid var(--mantine-color-blue-6)'
            : '1.5px dashed var(--mantine-color-gray-5)',
        }}
      />
    </Tooltip>
  );
}
