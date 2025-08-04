import React, { useEffect, useState } from 'react';
import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { useDeviceControlStore } from '@/store/deviceStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useBookDataStore } from '@/store/bookDataStore';
import { useResetViewSettings } from '../../hooks/useResetSettings';
import { getStyles } from '@/utils/style';
import { saveAndReload } from '@/utils/reload';
import { getMaxInlineSize } from '@/utils/config';
import { saveViewSettings } from '../../utils/viewSettingsHelper';
import { SettingsPanelPanelProp } from './SettingsDialog';
import NumberInput from './NumberInput';

const ControlPanel: React.FC<SettingsPanelPanelProp> = ({ bookKey, onRegisterReset }) => {
  const _ = useTranslation();
  const { envConfig, appService } = useEnv();
  const { getView, getViewSettings } = useReaderStore();
  const { getBookData } = useBookDataStore();
  const { acquireVolumeKeyInterception, releaseVolumeKeyInterception } = useDeviceControlStore();
  const bookData = getBookData(bookKey)!;
  const viewSettings = getViewSettings(bookKey)!;

  const [isScrolledMode, setScrolledMode] = useState(viewSettings.scrolled!);
  const [isContinuousScroll, setIsContinuousScroll] = useState(viewSettings.continuousScroll!);
  const [scrollingOverlap, setScrollingOverlap] = useState(viewSettings.scrollingOverlap!);
  const [volumeKeysToFlip, setVolumeKeysToFlip] = useState(viewSettings.volumeKeysToFlip!);
  const [isDisableClick, setIsDisableClick] = useState(viewSettings.disableClick!);
  const [swapClickArea, setSwapClickArea] = useState(viewSettings.swapClickArea!);
  const [animated, setAnimated] = useState(viewSettings.animated!);
  const [allowScript, setAllowScript] = useState(viewSettings.allowScript!);

  const resetToDefaults = useResetViewSettings();

  const handleReset = () => {
    resetToDefaults({
      scrolled: setScrolledMode,
      continuousScroll: setIsContinuousScroll,
      scrollingOverlap: setScrollingOverlap,
      volumeKeysToFlip: setVolumeKeysToFlip,
      disableClick: setIsDisableClick,
      swapClickArea: setSwapClickArea,
      animated: setAnimated,
      allowScript: setAllowScript,
    });
  };

  useEffect(() => {
    onRegisterReset(handleReset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isScrolledMode === viewSettings.scrolled) return;
    saveViewSettings(envConfig, bookKey, 'scrolled', isScrolledMode);
    getView(bookKey)?.renderer.setAttribute('flow', isScrolledMode ? 'scrolled' : 'paginated');
    getView(bookKey)?.renderer.setAttribute(
      'max-inline-size',
      `${getMaxInlineSize(viewSettings)}px`,
    );
    getView(bookKey)?.renderer.setStyles?.(getStyles(viewSettings!));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScrolledMode]);

  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'continuousScroll', isContinuousScroll, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isContinuousScroll]);

  useEffect(() => {
    if (scrollingOverlap === viewSettings.scrollingOverlap) return;
    saveViewSettings(envConfig, bookKey, 'scrollingOverlap', scrollingOverlap, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollingOverlap]);

  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'volumeKeysToFlip', volumeKeysToFlip, false, false);
    if (appService?.isMobileApp) {
      if (volumeKeysToFlip) {
        acquireVolumeKeyInterception();
      } else {
        releaseVolumeKeyInterception();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumeKeysToFlip]);

  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'disableClick', isDisableClick, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisableClick]);

  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'swapClickArea', swapClickArea, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapClickArea]);

  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'animated', animated, false, false);
    if (animated) {
      getView(bookKey)?.renderer.setAttribute('animated', '');
    } else {
      getView(bookKey)?.renderer.removeAttribute('animated');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated]);

  useEffect(() => {
    if (viewSettings.allowScript === allowScript) return;
    saveViewSettings(envConfig, bookKey, 'allowScript', allowScript, true, false);
    saveAndReload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowScript]);

  return (
    <div className='my-4 w-full space-y-6'>
      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Scroll')}</h2>
        <div className='card border-base-200 bg-base-100 border shadow'>
          <div className='divide-base-200 divide-y'>
            <div className='config-item'>
              <label htmlFor='scrolledMode' className=''>{_('Scrolled Mode')}</label>
              <input
                id='scrolledMode'
                type='checkbox'
                className='toggle'
                checked={isScrolledMode}
                onChange={() => setScrolledMode(!isScrolledMode)}
              />
            </div>
            <div className='config-item'>
              <label htmlFor="continuousScroll" className=''>{_('Continuous Scroll')}</label>
              <input
                id='continuousScroll'
                type='checkbox'
                className='toggle'
                checked={isContinuousScroll}
                onChange={() => setIsContinuousScroll(!isContinuousScroll)}
              />
            </div>
            <NumberInput
              label={_('Overlap Pixels')}
              value={scrollingOverlap}
              onChange={setScrollingOverlap}
              disabled={!viewSettings.scrolled}
              min={0}
              max={200}
              step={10}
            />
          </div>
        </div>
      </div>

      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Click')}</h2>
        <div className='card border-base-200 bg-base-100 border shadow'>
          <div className='divide-base-200'>
            <div className='config-item'>
              <span className=''>{_('Clicks for Page Flip')}</span>
              <input
                type='checkbox'
                className='toggle'
                checked={!isDisableClick}
                onChange={() => setIsDisableClick(!isDisableClick)}
              />
            </div>
            <div className='config-item'>
              <span className=''>{_('Swap Clicks Area')}</span>
              <input
                type='checkbox'
                className='toggle'
                checked={swapClickArea}
                disabled={isDisableClick}
                onChange={() => setSwapClickArea(!swapClickArea)}
              />
            </div>
            {appService?.isMobileApp && (
              <div className='config-item'>
                <span className=''>{_('Volume Keys for Page Flip')}</span>
                <input
                  type='checkbox'
                  className='toggle'
                  checked={volumeKeysToFlip}
                  onChange={() => setVolumeKeysToFlip(!volumeKeysToFlip)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Animation')}</h2>
        <div className='card border-base-200 bg-base-100 border shadow'>
          <div className='divide-base-200 divide-y'>
            <div className='config-item'>
              <span className=''>{_('Paging Animation')}</span>
              <input
                type='checkbox'
                className='toggle'
                checked={animated}
                onChange={() => setAnimated(!animated)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Security')}</h2>
        <div className='card border-base-200 bg-base-100 border shadow'>
          <div className='divide-base-200 divide-y'>
            <div className='config-item !h-16'>
              <div className='flex flex-col gap-1'>
                <span className=''>{_('Allow JavaScript')}</span>
                <span className='text-xs'>{_('Enable only if you trust the file.')}</span>
              </div>
              <input
                type='checkbox'
                className='toggle'
                checked={allowScript}
                disabled={bookData.book?.format !== 'EPUB'}
                onChange={() => setAllowScript(!allowScript)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
