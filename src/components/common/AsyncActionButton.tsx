import React from 'react';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useAsyncAction, AsyncActionMode, AsyncActionState } from '../../hooks/useAsyncAction';

export interface AsyncActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onAction?: () => Promise<void> | void;
  mode?: AsyncActionMode;
  idleLabel?: React.ReactNode;
  loadingLabel?: React.ReactNode;
  successLabel?: React.ReactNode;
  errorLabel?: React.ReactNode;
  idleIcon?: React.ReactNode;
  loadingIcon?: React.ReactNode;
  successIcon?: React.ReactNode;
  errorIcon?: React.ReactNode;
  successDurationMs?: number;
  errorDurationMs?: number;
  variant?: 'primary' | 'secondary' | 'pacific' | 'emerald' | 'amber' | 'danger' | 'ghost' | 'outline' | 'custom';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  onSuccess?: () => void;
  onError?: (err: any) => void;
}

const variantStyles: Record<string, string> = {
  pacific: 'bg-[#7FB706] hover:bg-[#72A405] text-white font-bold',
  primary: 'bg-[#85431E] hover:bg-[#6D3618] text-white font-bold',
  secondary: 'bg-[#34150F]/10 hover:bg-[#34150F]/20 text-[#34150F] font-semibold',
  emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold',
  amber: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white font-bold',
  ghost: 'bg-transparent hover:bg-[#34150F]/5 text-[#34150F]/70 hover:text-[#34150F]',
  outline: 'bg-white hover:bg-[#FDFDF4] text-[#34150F] border border-[#34150F]/20',
  custom: '',
};

const sizeStyles: Record<string, string> = {
  sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
  md: 'text-xs px-3.5 py-2 rounded-xl gap-2 font-bold',
  lg: 'text-sm px-4 py-2.5 rounded-xl gap-2 font-bold',
  icon: 'p-1.5 rounded-lg text-xs justify-center',
};

export const AsyncActionButton = React.forwardRef<HTMLButtonElement, AsyncActionButtonProps>(
  (
    {
      onAction,
      mode = 'download',
      idleLabel,
      loadingLabel,
      successLabel,
      errorLabel,
      idleIcon,
      loadingIcon,
      successIcon,
      errorIcon,
      successDurationMs = 800,
      errorDurationMs = 2500,
      variant = 'secondary',
      size = 'sm',
      disabled,
      className = '',
      onClick,
      children,
      onSuccess,
      onError,
      ...props
    },
    ref
  ) => {
    const { state, isLoading, isSuccess, isError, errorMessage, execute, ariaLiveMessage } = useAsyncAction(
      onAction,
      {
        mode,
        successDurationMs,
        errorDurationMs,
        onSuccess,
        onError,
      }
    );

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (!e.defaultPrevented && onAction) {
        await execute();
      }
    };

    // Default label selection
    const resolvedIdleLabel = children !== undefined ? children : idleLabel;
    const defaultLoadingLabel = mode === 'download' ? 'Preparing…' : mode === 'copy' ? 'Copying…' : 'Loading…';
    const defaultSuccessLabel = mode === 'copy' ? 'Copied!' : 'Downloaded!';
    const defaultErrorLabel = 'Failed - Retry';

    // Default icons
    const defaultIdleIcon = idleIcon;
    const defaultLoadingIcon = loadingIcon || <RefreshCw size={13} className="animate-spin motion-reduce:animate-none shrink-0" />;
    const defaultSuccessIcon = successIcon || <Check size={13} className="text-emerald-400 shrink-0" />;
    const defaultErrorIcon = errorIcon || <AlertCircle size={13} className="text-red-400 shrink-0" />;

    // Dynamic classes depending on state
    let stateClasses = '';
    if (isLoading) {
      stateClasses = 'opacity-80 cursor-wait';
    } else if (isSuccess) {
      stateClasses = 'bg-emerald-700 text-white border-emerald-600';
    } else if (isError) {
      stateClasses = 'bg-rose-700 text-white border-rose-600';
    }

    const baseClasses =
      variant !== 'custom'
        ? `inline-flex items-center justify-center font-medium transition-all duration-200 shadow-sm select-none ${variantStyles[variant] || ''} ${sizeStyles[size] || ''}`
        : '';

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={`${baseClasses} ${stateClasses} ${className}`}
        aria-busy={isLoading}
        title={isError && errorMessage ? errorMessage : props.title}
        {...props}
      >
        {/* Screen Reader Announcements */}
        <span className="sr-only" aria-live="polite">
          {ariaLiveMessage}
        </span>

        {/* State Content */}
        {isLoading ? (
          <>
            {defaultLoadingIcon}
            {size !== 'icon' && <span>{loadingLabel || defaultLoadingLabel}</span>}
          </>
        ) : isSuccess ? (
          <>
            {defaultSuccessIcon}
            {size !== 'icon' && <span>{successLabel || defaultSuccessLabel}</span>}
          </>
        ) : isError ? (
          <>
            {defaultErrorIcon}
            {size !== 'icon' && <span>{errorLabel || defaultErrorLabel}</span>}
          </>
        ) : (
          <>
            {defaultIdleIcon}
            {resolvedIdleLabel && (typeof resolvedIdleLabel === 'string' ? <span>{resolvedIdleLabel}</span> : resolvedIdleLabel)}
          </>
        )}
      </button>
    );
  }
);

AsyncActionButton.displayName = 'AsyncActionButton';
