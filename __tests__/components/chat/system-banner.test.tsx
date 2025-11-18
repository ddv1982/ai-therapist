import { screen, fireEvent } from '@testing-library/react';
import { ComponentTestUtils } from '__tests__/utils/test-utilities';
import { SystemBanner } from '@/features/chat/components/system-banner';

describe('SystemBanner', () => {
  test('renders when hasMemory and messages exist', () => {
    const onManage = jest.fn();
    ComponentTestUtils.renderWithProviders(
      <SystemBanner
        hasMemory={true}
        messageCount={3}
        isMobile={false}
        onManageMemory={onManage}
        formatText={() => 'Memory summary'}
        contextInfo={{ hasMemory: true, reportCount: 2 }}
      />
    );
    expect(screen.getByText('Memory summary')).toBeInTheDocument();
  });

  test('invokes manage on click', () => {
    const onManage = jest.fn();
    ComponentTestUtils.renderWithProviders(
      <SystemBanner
        hasMemory={true}
        messageCount={3}
        isMobile={false}
        onManageMemory={onManage}
        formatText={() => 'Memory summary'}
        contextInfo={{ hasMemory: true, reportCount: 2 }}
      />
    );
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onManage).toHaveBeenCalled();
  });
});
