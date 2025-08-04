import clsx from 'clsx';
import i18n from 'i18next';
import React, { useEffect, useState } from 'react';
import { useEnv } from '@/context/EnvContext';
import { useAuth } from '@/context/AuthContext';
import { useReaderStore } from '@/store/readerStore';
import { useTranslation } from '@/hooks/useTranslation';
import { saveViewSettings } from '../../utils/viewSettingsHelper';
import { getTranslators } from '@/services/translators';
import { TRANSLATED_LANGS, TRANSLATOR_LANGS } from '@/services/constants';
import { SettingsPanelPanelProp } from './SettingsDialog';
import { useResetViewSettings } from '../../hooks/useResetSettings';
import { saveAndReload } from '@/utils/reload';
import { initDayjs } from '@/utils/time';
import Select from '@/components/Select';

const LangPanel: React.FC<SettingsPanelPanelProp> = ({ bookKey, onRegisterReset }) => {
  const _ = useTranslation();
  const { token } = useAuth();
  const { envConfig } = useEnv();
  const { getViewSettings, setViewSettings } = useReaderStore();
  const viewSettings = getViewSettings(bookKey)!;

  const [uiLanguage, setUILanguage] = useState(viewSettings.uiLanguage!);
  const [translationEnabled, setTranslationEnabled] = useState(viewSettings.translationEnabled!);
  const [translationProvider, setTranslationProvider] = useState(viewSettings.translationProvider!);
  const [translateTargetLang, setTranslateTargetLang] = useState(viewSettings.translateTargetLang!);
  const [showTranslateSource, setShowTranslateSource] = useState(viewSettings.showTranslateSource!);

  const resetToDefaults = useResetViewSettings();

  const handleReset = () => {
    resetToDefaults({
      uiLanguage: setUILanguage,
      translationEnabled: setTranslationEnabled,
      translationProvider: setTranslationProvider,
      translateTargetLang: setTranslateTargetLang,
    });
  };

  useEffect(() => {
    onRegisterReset(handleReset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentUILangOption = () => {
    const uiLanguage = viewSettings.uiLanguage;
    return {
      value: uiLanguage,
      label:
        uiLanguage === ''
          ? _('Auto')
          : TRANSLATED_LANGS[uiLanguage as keyof typeof TRANSLATED_LANGS],
    };
  };

  const getLangOptions = (langs: Record<string, string>) => {
    const options = Object.entries(langs).map(([value, label]) => ({ value, label }));
    options.sort((a, b) => a.label.localeCompare(b.label));
    options.unshift({ value: '', label: _('System Language') });
    return options;
  };

  const handleSelectUILang = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const option = event.target.value;
    setUILanguage(option);
  };

  const getTranslationProviderOptions = () => {
    const translators = getTranslators();
    const availableProviders = translators.map((t) => {
      let label = t.label;
      if (t.authRequired && !token) {
        label = `${label} (${_('Login Required')})`;
      } else if (t.quotaExceeded) {
        label = `${label} (${_('Quota Exceeded')})`;
      }
      return { value: t.name, label };
    });
    return availableProviders;
  };

  const getCurrentTranslationProviderOption = () => {
    const value = translationProvider;
    const allProviders = getTranslationProviderOptions();
    const availableTranslators = getTranslators().filter(
      (t) => (t.authRequired ? !!token : true) && !t.quotaExceeded,
    );
    const currentProvider = availableTranslators.find((t) => t.name === value)
      ? value
      : availableTranslators[0]?.name;
    return allProviders.find((p) => p.value === currentProvider) || allProviders[0]!;
  };

  const handleSelectTranslationProvider = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const option = event.target.value;
    setTranslationProvider(option);
    saveViewSettings(envConfig, bookKey, 'translationProvider', option, false, false);
    viewSettings.translationProvider = option;
    setViewSettings(bookKey, { ...viewSettings });
  };

  const getCurrentTargetLangOption = () => {
    const value = translateTargetLang;
    const availableOptions = getLangOptions(TRANSLATOR_LANGS);
    return availableOptions.find((o) => o.value === value) || availableOptions[0]!;
  };

  const handleSelectTargetLang = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const option = event.target.value;
    setTranslateTargetLang(option);
    saveViewSettings(envConfig, bookKey, 'translateTargetLang', option, false, false);
    viewSettings.translateTargetLang = option;
    setViewSettings(bookKey, { ...viewSettings });
  };

  useEffect(() => {
    if (uiLanguage === viewSettings.uiLanguage) return;
    saveViewSettings(envConfig, bookKey, 'uiLanguage', uiLanguage, false, false);
    const locale = uiLanguage ? uiLanguage : navigator.language;
    i18n.changeLanguage(locale);
    initDayjs(locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiLanguage]);

  useEffect(() => {
    if (translationEnabled === viewSettings.translationEnabled) return;
    saveViewSettings(envConfig, bookKey, 'translationEnabled', translationEnabled, true, false);
    viewSettings.translationEnabled = translationEnabled;
    setViewSettings(bookKey, { ...viewSettings });
    if (!showTranslateSource && !translationEnabled) {
      saveAndReload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translationEnabled]);

  useEffect(() => {
    if (showTranslateSource === viewSettings.showTranslateSource) return;
    saveViewSettings(envConfig, bookKey, 'showTranslateSource', showTranslateSource, false, false);
    saveAndReload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTranslateSource]);

  return (
    <div className={clsx('my-4 w-full space-y-6')}>
      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Language')}</h2>
        <div className='card border-base-200 bg-base-100 border shadow'>
          <div className='divide-base-200 divide-y'>
            <div className='config-item'>
              <span className=''>{_('Interface Language')}</span>
              <Select
                value={getCurrentUILangOption().value}
                onChange={handleSelectUILang}
                options={getLangOptions(TRANSLATED_LANGS)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Translation')}</h2>
        <div className='card border-base-200 bg-base-100 border shadow'>
          <div className='divide-base-200'>
            <div className='config-item'>
              <span className=''>{_('Enable Translation')}</span>
              <input
                type='checkbox'
                className='toggle'
                checked={translationEnabled}
                onChange={() => setTranslationEnabled(!translationEnabled)}
              />
            </div>

            <div className='config-item'>
              <span className=''>{_('Show Source Text')}</span>
              <input
                type='checkbox'
                className='toggle'
                checked={showTranslateSource}
                disabled={!translationEnabled}
                onChange={() => setShowTranslateSource(!showTranslateSource)}
              />
            </div>

            <div className='config-item'>
              <span className=''>{_('Translation Service')}</span>
              <Select
                value={getCurrentTranslationProviderOption().value}
                onChange={handleSelectTranslationProvider}
                options={getTranslationProviderOptions()}
                disabled={!translationEnabled}
              />
            </div>

            <div className='config-item'>
              <span className=''>{_('Translate To')}</span>
              <Select
                value={getCurrentTargetLangOption().value}
                onChange={handleSelectTargetLang}
                options={getLangOptions(TRANSLATOR_LANGS)}
                disabled={!translationEnabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LangPanel;
