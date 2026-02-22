import { Utils } from "@langboard/core/utils";
import { differenceInDays, Duration, formatDistanceToNow } from "date-fns";
import { TFunction, i18n } from "i18next";
import * as dateLocale from "date-fns/locale";
import { API_URL } from "@/constants";

Utils.String.formatDateLocale = (date: Date) => date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

Utils.String.formatDateDistance = (i18n: i18n, translate: TFunction<"translation", undefined>, date: Date): string => {
    return differenceInDays(Date.now(), date) >= 1
        ? Utils.String.formatDateLocale(date)
        : translate("date.{distance} ago", {
              distance: formatDistanceToNow(date, {
                  locale: dateLocale[new Utils.String.Case(i18n.language).toLanguageObjKey() as keyof typeof dateLocale],
              }),
          });
};

Utils.String.formatTimerDuration = (duration: Duration) => {
    let hours = duration.hours ?? 0;
    if (duration.years) {
        hours += duration.years * 365 * 24;
    }
    if (duration.months) {
        hours += duration.months * 30 * 24;
    }
    if (duration.days) {
        hours += duration.days * 24;
    }

    const timeTextChunks: string[] = [];
    if (hours > 0) {
        timeTextChunks.push(`${hours}h`);
    }
    if (hours < 100) {
        if (duration.minutes) {
            timeTextChunks.push(`${duration.minutes}m`);
        }
        if (duration.seconds) {
            timeTextChunks.push(`${duration.seconds}s`);
        }
    }

    if (!timeTextChunks.length) {
        timeTextChunks.push("0s");
    }

    return timeTextChunks.join(" ");
};

Utils.String.convertServerFileURL = <TURL extends string | undefined>(url: TURL): TURL extends string ? string : undefined => {
    if (!url) {
        return url as unknown as TURL extends string ? string : undefined;
    }

    if (url.startsWith("http")) {
        return url as unknown as TURL extends string ? string : undefined;
    }

    return `${API_URL}${url}` as unknown as TURL extends string ? string : undefined;
};

Utils.String.isValidURL = (str: unknown): bool => {
    if (!Utils.Type.isString(str)) {
        return false;
    }

    try {
        new URL(str);
        return true;
    } catch (err) {
        return false;
    }
};
