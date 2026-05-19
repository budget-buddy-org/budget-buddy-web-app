import { PageHeader } from '@/components/layout/PageHeader';
import { AccountSection } from '@/components/settings/AccountSection';
import { FontSizeSection } from '@/components/settings/FontSizeSection';
import { InterfaceSection } from '@/components/settings/InterfaceSection';
import { PreferencesSection } from '@/components/settings/PreferencesSection';
import { PrimaryColorSection } from '@/components/settings/PrimaryColorSection';
import { ThemeSection } from '@/components/settings/ThemeSection';
import { VersionSection } from '@/components/settings/VersionSection';
import { PageContainer } from '@/components/ui/page-container';

export function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader title="Settings" subtitle="Manage your application appearance and preferences." />
      <div className="grid gap-6">
        <AccountSection />
        <PreferencesSection />
        <ThemeSection />
        <PrimaryColorSection />
        <FontSizeSection />
        <InterfaceSection />
        <VersionSection />
      </div>
    </PageContainer>
  );
}
