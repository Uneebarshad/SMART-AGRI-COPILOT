import { useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge, Banner, Button, Card, SelectField, StatCard } from '../components/ui';
import { CalendarIcon } from '../components/ui/icons/CalendarIcon';
import { CheckCircleIcon } from '../components/ui/icons/CheckCircleIcon';
import { DropletIcon } from '../components/ui/icons/DropletIcon';
import { SproutIcon } from '../components/ui/icons/SproutIcon';

const SEASON_OPTIONS = [
  { value: 'Kharif', label: 'Kharif · summer crops' },
  { value: 'Rabi', label: 'Rabi · winter crops' },
  { value: 'Spring', label: 'Spring season' },
];

const WATER_OPTIONS = [
  { value: 'limited', label: 'Limited' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'reliable', label: 'Reliable' },
];

const SOIL_OPTIONS = [
  { value: 'loamy', label: 'Loamy' },
  { value: 'clay', label: 'Clay' },
  { value: 'sandy', label: 'Sandy' },
];

const GUIDANCE = {
  Kharif: [
    { name: 'Maize', fit: 'Strong fit', timing: 'Sow in the next 2–3 weeks', reason: 'Handles warm days well and fits a moderate water plan.', tone: 'success' },
    { name: 'Rice', fit: 'Consider with water', timing: 'Prepare nursery this month', reason: 'A good option when dependable irrigation and drainage are available.', tone: 'info' },
    { name: 'Cotton', fit: 'Watch the season', timing: 'Review pest plan before sowing', reason: 'Can perform well, but needs regular scouting and timely field care.', tone: 'warning' },
  ],
  Rabi: [
    { name: 'Wheat', fit: 'Strong fit', timing: 'Prepare seedbed in October', reason: 'A dependable cool-season crop for many Punjab field conditions.', tone: 'success' },
    { name: 'Chickpea', fit: 'Lower water need', timing: 'Plan sowing after soil preparation', reason: 'A practical choice when irrigation is limited and soil drains well.', tone: 'info' },
    { name: 'Canola', fit: 'Good rotation option', timing: 'Check local variety guidance', reason: 'Adds rotation value when planting dates and moisture are on track.', tone: 'warning' },
  ],
  Spring: [
    { name: 'Maize', fit: 'Strong fit', timing: 'Sow when soil warms', reason: 'A flexible option for a short warm-season window.', tone: 'success' },
    { name: 'Vegetables', fit: 'Good for close care', timing: 'Stagger planting for supply', reason: 'Works well when you can check the crop frequently.', tone: 'info' },
    { name: 'Cotton', fit: 'Plan carefully', timing: 'Confirm planting window', reason: 'Needs a long warm season and early pest monitoring.', tone: 'warning' },
  ],
};

export function CropRecommendationPage() {
  const [season, setSeason] = useState('Kharif');
  const [water, setWater] = useState('moderate');
  const [soil, setSoil] = useState('loamy');
  const [area, setArea] = useState('');
  const [applied, setApplied] = useState(false);
  usePageTitle('Crop recommendation');

  const recommendations = GUIDANCE[season];

  const handleSubmit = (event) => {
    event.preventDefault();
    setApplied(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Crop recommendation"
        subtitle="Compare practical crop options using the season, soil, and water conditions you know best."
        eyebrow="Plan your next crop"
      />

      <Banner tone="info">
        This is a local planning guide, not a guaranteed yield forecast. Confirm seed choice and planting dates with local agriculture advice.
      </Banner>

      {applied && (
        <Banner tone="success">Your crop plan was updated using the conditions you entered.</Banner>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(17rem,0.75fr)_minmax(0,1.5fr)] lg:items-start">
        <Card>
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400">
              <SproutIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight text-soil-900">Your conditions</h2>
              <p className="mt-1 text-sm leading-relaxed text-soil-600">Use broad inputs to shape the starting shortlist.</p>
            </div>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <SelectField label="Growing season" value={season} onChange={(event) => { setSeason(event.target.value); setApplied(false); }} options={SEASON_OPTIONS} />
            <SelectField label="Water availability" value={water} onChange={(event) => { setWater(event.target.value); setApplied(false); }} options={WATER_OPTIONS} />
            <SelectField label="Soil type" value={soil} onChange={(event) => { setSoil(event.target.value); setApplied(false); }} options={SOIL_OPTIONS} />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-soil-800">Area to plant <span className="font-normal text-soil-500">(optional)</span></span>
              <span className="flex h-11 items-center rounded-md border border-soil-300 bg-surface px-3 focus-within:border-field-600 focus-within:ring-2 focus-within:ring-field-600/20">
                <input type="number" min="0" step="0.1" value={area} onChange={(event) => { setArea(event.target.value); setApplied(false); }} placeholder="e.g. 4.5" className="min-w-0 flex-1 bg-transparent text-base text-soil-900 outline-none placeholder:text-soil-400" />
                <span className="text-sm text-soil-500">acres</span>
              </span>
            </label>
            <Button type="submit" fullWidth>Update recommendations</Button>
          </form>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-soil-900">Best starting options</h2>
              <p className="mt-1 text-sm text-soil-600">Shortlist for {season.toLowerCase()} with {water} water access and {soil} soil.</p>
            </div>
            <Badge tone="neutral">Local guide</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {recommendations.map((recommendation, index) => (
              <Card key={recommendation.name} className={index === 0 ? 'border-field-300 dark:border-field-500/30 shadow-raised' : ''}>
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400">
                    <SproutIcon className="h-5 w-5" />
                  </span>
                  <Badge tone={recommendation.tone}>{recommendation.fit}</Badge>
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-soil-900">{recommendation.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-soil-600">{recommendation.reason}</p>
                <div className="mt-4 space-y-2 border-t border-soil-100 pt-3 text-xs text-soil-600">
                  <p className="flex items-start gap-2"><CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-soil-400" />{recommendation.timing}</p>
                  <p className="flex items-start gap-2"><DropletIcon className="mt-0.5 h-4 w-4 shrink-0 text-soil-400" />Water plan: {water}</p>
                </div>
              </Card>
            ))}
          </div>

          <Card className="border-field-200 bg-field-50 dark:border-field-500/30 dark:bg-field-900/15">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-field-700 dark:text-field-400" />
              <div>
                <h3 className="text-sm font-semibold text-field-900 dark:text-field-400">A useful next step</h3>
                <p className="mt-1 text-sm leading-relaxed text-field-800 dark:text-field-300">Compare the top option with your available seed, labour, and expected harvest window before deciding.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard icon={CalendarIcon} label="Season" value={season} />
        <StatCard icon={DropletIcon} label="Water access" value={water} />
        <StatCard icon={SproutIcon} label="Options" value={recommendations.length} unit="crops" />
      </div>
    </div>
  );
}

export default CropRecommendationPage;
