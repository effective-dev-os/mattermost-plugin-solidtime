import {useCallback, useEffect, useRef, useState} from 'react';

export type PortalPopoverStyle = {
    position: 'fixed';
    top: number;
    left: number;
    width: number;
    maxHeight?: number;
    zIndex: number;
};

type Options = {
    width?: number;
    matchTriggerWidth?: boolean;
    minSpaceBelow?: number;
    maxHeight?: number;
};

export function usePortalPopover(open: boolean, onClose: () => void, options: Options) {
    const triggerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<PortalPopoverStyle | null>(null);

    const updatePosition = useCallback(() => {
        if (!triggerRef.current) {
            return;
        }
        const rect = triggerRef.current.getBoundingClientRect();
        const baseWidth = options.matchTriggerWidth ? rect.width : (options.width ?? rect.width);
        const width = Math.min(baseWidth, window.innerWidth - 16);
        let left = rect.left;
        if (left + width > window.innerWidth - 8) {
            left = window.innerWidth - width - 8;
        }
        left = Math.max(8, left);

        const minSpace = options.minSpaceBelow ?? 120;
        const spaceBelow = window.innerHeight - rect.bottom - 12;
        const maxHeight = options.maxHeight ?? Math.min(320, Math.max(minSpace, spaceBelow));
        const top = spaceBelow < minSpace && rect.top > maxHeight ?
            rect.top - maxHeight - 4 :
            rect.bottom + 4;

        setStyle({
            position: 'fixed',
            top,
            left,
            width,
            maxHeight,
            zIndex: 10000,
        });
    }, [options.matchTriggerWidth, options.maxHeight, options.minSpaceBelow, options.width]);

    useEffect(() => {
        if (!open) {
            setStyle(null);
            return undefined;
        }
        updatePosition();
        const onScroll = (e: Event) => {
            if (popoverRef.current?.contains(e.target as Node)) {
                return;
            }
            updatePosition();
        };
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
                return;
            }
            onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open, onClose]);

    return {triggerRef, popoverRef, style};
}
