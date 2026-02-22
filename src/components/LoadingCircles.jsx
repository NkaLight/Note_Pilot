import {useEffect} from "react"

export default function LoadingCircles({className}){
    return(
        <div className={className}>
            <svg class="spinning-dots" viewBox="0 0 100 100">
                <circle cx="50" cy="20" r="4" fill="#3498db" />
                <circle cx="67.32" cy="25.98" r="4" fill="#3498db" />
                <circle cx="78.66" cy="41.34" r="4" fill="#3498db" />
                <circle cx="80" cy="60" r="4" fill="#3498db" />
                <circle cx="67.32" cy="74.02" r="4" fill="#3498db" />
                <circle cx="50" cy="80" r="4" fill="#3498db" />
                <circle cx="32.68" cy="74.02" r="4" fill="#3498db" />
                <circle cx="20" cy="60" r="4" fill="#3498db" />
            </svg>
        </div>
    )
}