/** @format */
'use client';

import { APIProvider, AdvancedMarker, Map, Marker } from '@vis.gl/react-google-maps';
import { MapPin, PanelTop, Sun, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

import Button from '@/components/ui/Button';

type Props = {
	client: string;
};

export default function Solar({ client }: Props) {
	const [solar, setSolar] = useState<any>(null);
	const [selectedPanels, setSelectedPanels] = useState<number>(0);
	const [loading, setLoading] = useState(true);
	const [calculating, setCalculating] = useState(false);
	const [error, setError] = useState('');

	const [address, setAddress] = useState({
		lat: 0,
		lng: 0,
	});

	async function loadMetadata() {
		try {
			const data = await fetch(`/api/projects/metadata?client=${encodeURIComponent(client)}`)
				.then((res) => res.json())
				.catch(() => setError('Failed to analyze'));

			if (!data) return;

			setAddress({
				lat: data?.address?.lat ?? 0,
				lng: data?.address?.lng ?? 0,
			});

			if (data?.solar) {
				setSolar(data.solar);

				setSelectedPanels(data.solar.recommended?.panelsCount ?? 0);
			}
		} finally {
			setLoading(false);
		}
	}

	async function analyzeRoof() {
		try {
			setCalculating(true);

			const data = await fetch('/api/projects/solar', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					lat: address.lat,
					lng: address.lng,
				}),
			})
				.then((res) => res.json())
				.catch(() => setError('Failed to analyze'));

			if (data.error) return setError(data.error);

			setSolar(data);

			await fetch('/api/projects/metadata', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					client,
					data: {
						solar: data,
					},
				}),
			});
		} catch (error) {
			console.error(error);
		} finally {
			setCalculating(false);
		}
	}

	useEffect(() => {
		loadMetadata();
	}, [client]);

	const selectedConfig = solar?.configs?.find((x: any) => x.panelsCount === selectedPanels) ?? solar?.recommended;
	function getDirection(azimuth: number) {
		if (azimuth >= 337.5 || azimuth < 22.5) return 'North';
		if (azimuth < 67.5) return 'North-East';
		if (azimuth < 112.5) return 'East';
		if (azimuth < 157.5) return 'South-East';
		if (azimuth < 202.5) return 'South';
		if (azimuth < 247.5) return 'South-West';
		if (azimuth < 292.5) return 'West';
		return 'North-West';
	}

	const visiblePanels =
		solar?.solarPanels?.filter((panel: any) => {
			const summary = selectedConfig?.roofSegmentSummaries?.find((x: any) => x.segmentIndex === panel.segmentIndex);

			if (!summary) {
				return false;
			}

			const panelsInSegment = solar.solarPanels.filter((p: any) => p.segmentIndex === panel.segmentIndex);

			const indexInSegment = panelsInSegment.indexOf(panel);

			return indexInSegment < summary.panelsCount;
		}) ?? [];

	if (loading) {
		return null;
	}

	if (error) {
		return <>{error}</>;
	}

	return (
		<div className='flex flex-col gap-6'>
			<div className='flex items-center justify-between'>
				<div>
					<div className='text-xl font-semibold'>Solar Analysis</div>

					<div
						className='text-sm'
						style={{
							color: 'var(--text-muted)',
						}}>
						{address.lat.toFixed(6)}, {address.lng.toFixed(6)}
					</div>
				</div>

				<Button loading={calculating} onClick={analyzeRoof}>
					<Sun size={16} />
					Analyze Roof
				</Button>
			</div>

			{solar?.recommended && (
				<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
					<div
						className='rounded-xl p-4'
						style={{
							background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
							border: '1px solid color-mix(in srgb, var(--accent) 20%, var(--border))',
						}}>
						<div className='text-sm mb-2'>Recommended</div>

						<div className='text-3xl font-bold'>{solar.recommended.panelsCount}</div>

						<div
							className='text-sm'
							style={{
								color: 'var(--text-muted)',
							}}>
							{Math.round(solar.recommended.yearlyEnergyDcKwh).toLocaleString()} kWh/year
						</div>
					</div>

					<div
						className='rounded-xl p-4'
						style={{
							background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
							border: '1px solid color-mix(in srgb, var(--accent) 20%, var(--border))',
						}}>
						<div className='text-sm mb-2'>Maximum</div>

						<div className='text-3xl font-bold'>{solar.maximum.panelsCount}</div>

						<div
							className='text-sm'
							style={{
								color: 'var(--text-muted)',
							}}>
							{Math.round(solar.maximum.yearlyEnergyDcKwh).toLocaleString()} kWh/year
						</div>
					</div>

					<div
						className='rounded-xl p-4'
						style={{
							background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
							border: '1px solid color-mix(in srgb, var(--accent) 20%, var(--border))',
						}}>
						<div className='text-sm mb-2'>Roof Area</div>

						<div className='text-3xl font-bold'>
							{Math.round(solar.roofArea ?? 0)}
							m²
						</div>

						<div
							className='text-sm'
							style={{
								color: 'var(--text-muted)',
							}}>
							{Math.round(solar.maxSunshineHoursPerYear ?? 0)} sun hours
						</div>
					</div>
				</div>
			)}

			{solar?.configs?.length > 0 && (
				<div
					className='rounded-xl p-4'
					style={{
						background: 'var(--container)',
						border: '1px solid var(--border)',
					}}>
					<div className='flex items-center justify-between mb-4'>
						<div className='font-medium'>System Size</div>

						{solar?.recommended && (
							<div
								className='px-3 py-1 rounded-lg text-sm'
								style={{
									background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
									border: '1px solid color-mix(in srgb, var(--accent) 20%, var(--border))',
								}}>
								Recommended: {solar.recommended.panelsCount} panels
							</div>
						)}
					</div>

					<select
						value={selectedPanels}
						onChange={(e) => setSelectedPanels(Number(e.target.value))}
						className='w-full rounded-xl px-3 h-10'
						style={{
							background: 'var(--bg-main)',
							border: '1px solid var(--border)',
						}}>
						{solar.configs.map((config: any) => (
							<option key={config.panelsCount} value={config.panelsCount}>
								{config.panelsCount} panels • {Math.round(config.yearlyEnergyDcKwh).toLocaleString()}
								kWh/year
								{config.panelsCount === solar.recommended?.panelsCount ? ' ⭐ Recommended' : ''}
							</option>
						))}
					</select>

					{selectedConfig && (
						<div className='mt-4'>
							<div className='text-3xl font-bold'>{selectedConfig.panelsCount} Panels</div>

							<div
								className='text-sm'
								style={{
									color: 'var(--text-muted)',
								}}>
								{Math.round(selectedConfig.yearlyEnergyDcKwh).toLocaleString()}
								kWh/year
							</div>
						</div>
					)}
				</div>
			)}

			{solar?.solarPanels?.length > 0 && (
				<APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
					<div
						className='rounded-xl overflow-hidden'
						style={{
							border: '1px solid var(--border)',
						}}>
						<Map
							mapId={'map'}
							center={address}
							defaultZoom={21}
							mapTypeId='satellite'
							style={{
								width: '100%',
								height: '600px',
							}}>
							{visiblePanels.map((panel: any, index: number) => (
								<AdvancedMarker
									key={index}
									position={{
										lat: panel.center.latitude,
										lng: panel.center.longitude,
									}}>
									<div className='bg-blue-950 border-2 border-white h-10 w-5'></div>
								</AdvancedMarker>
							))}
						</Map>
					</div>
				</APIProvider>
			)}

			{selectedConfig?.roofSegmentSummaries?.length > 0 && (
				<div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
					{selectedConfig.roofSegmentSummaries.map((segment: any, index: number) => (
						<div
							key={index}
							className='rounded-xl p-4'
							style={{
								background: 'var(--container)',
								border: '1px solid var(--border)',
							}}>
							<div className='font-medium'>{getDirection(segment.azimuthDegrees)}</div>

							<div
								className='text-sm mt-2'
								style={{
									color: 'var(--text-muted)',
								}}>
								<div>{segment.panelsCount} panels</div>

								<div>{Math.round(segment.yearlyEnergyDcKwh).toLocaleString()} kWh/year</div>

								<div>
									Orientation:
									{segment.azimuthDegrees?.toFixed(0)}°
								</div>

								<div>
									Roof Pitch:
									{segment.pitchDegrees?.toFixed(0)}°
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			<details>
				<summary>Raw Google Data</summary>

				<pre
					className='mt-4 p-4 rounded-xl overflow-auto text-xs'
					style={{
						background: 'var(--container)',
						border: '1px solid var(--border)',
						maxHeight: 500,
					}}>
					{JSON.stringify(solar?.raw, null, 2)}
				</pre>
			</details>
		</div>
	);
}
