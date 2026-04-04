
export function FileIconPlus({className="w-6 h-6", ...props}){
    return(
        <svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
            <path d="M7.66667 6.33333V10.3333M5.66667 8.33333H9.66667M14.3333 11.6667C14.3333 12.0203 14.1929 12.3594 13.9428 12.6095C13.6928 12.8595 13.3536 13 13 13H2.33333C1.97971 13 1.64057 12.8595 1.39052 12.6095C1.14048 12.3594 1 12.0203 1 11.6667V2.33333C1 1.97971 1.14048 1.64057 1.39052 1.39052C1.64057 1.14048 1.97971 1 2.33333 1H5.66667L7 3H13C13.3536 3 13.6928 3.14048 13.9428 3.39052C14.1929 3.64057 14.3333 3.97971 14.3333 4.33333V11.6667Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export function FileIcon({className="w-6 h6"}){
    return(
        <svg width="19" height="17" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M17.6667 14.3333C17.6667 14.7754 17.4911 15.1993 17.1785 15.5118C16.866 15.8244 16.442 16 16 16H2.66667C2.22464 16 1.80072 15.8244 1.48816 15.5118C1.17559 15.1993 1 14.7754 1 14.3333V2.66667C1 2.22464 1.17559 1.80072 1.48816 1.48816C1.80072 1.17559 2.22464 1 2.66667 1H6.83333L8.5 3.5H16C16.442 3.5 16.866 3.67559 17.1785 3.98816C17.4911 4.30072 17.6667 4.72464 17.6667 5.16667V14.3333Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export function UploadIcon({className="h-6 w-6"}){
    return(
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M13 9V11.6667C13 12.0203 12.8595 12.3594 12.6095 12.6095C12.3594 12.8595 12.0203 13 11.6667 13H2.33333C1.97971 13 1.64057 12.8595 1.39052 12.6095C1.14048 12.3594 1 12.0203 1 11.6667V9M10.3333 4.33333L7 1M7 1L3.66667 4.33333M7 1V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

    );
}