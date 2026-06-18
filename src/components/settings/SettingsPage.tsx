import { PageHeader } from '@/components/layout/PageHeader';
import { AccountSection } from '@/components/settings/AccountSection';
import { DangerZoneSection } from '@/components/settings/DangerZoneSection';
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
      {/* Single column up to lg, then a balanced two-column grid that fills the
          desktop canvas. Danger Zone spans the full width on its own row. */}
      <div className="mx-auto grid max-w-2xl gap-6 lg:max-w-none lg:grid-cols-2 lg:items-start">
        <AccountSection />
        <PreferencesSection />
        <ThemeSection />
        <PrimaryColorSection />
        <FontSizeSection />
        <InterfaceSection />
        <VersionSection />
        <div className="lg:col-span-2">
          <DangerZoneSection />
        </div>
      </div>
    </PageContainer>
  );
}
