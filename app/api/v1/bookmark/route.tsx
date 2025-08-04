import { sendData } from "@/serverActions/addBookmark";

type data = {
    categories: string,
    labels: [] | labelData[],
    link: string
    bearerToken: string | undefined
}
type labelData = {
    id: string,
    text: string
}

function getCorsHeaders(origin: string | null) {
    const isChromeExtension = origin && origin.startsWith("chrome-extension://");

    return {
        "Access-Control-Allow-Origin": isChromeExtension ? origin : "",
        "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
        "Content-Type": "application/json",
        "Vary": "Origin",
    };
}

export async function OPTIONS(request: Request) {

    const origin = request.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);
    console.log("Origin:", origin);

    return new Response(null, {
        status: 200, // No Content
        headers: corsHeaders,
    });
}


export async function POST(request: Request) {
    // console.log(request);
    const origin = request.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    const authorizationHeader = request.headers.get('authorization')
    const bearerToken = authorizationHeader?.startsWith("Bearer ")
        ? authorizationHeader.substring(7)
        : undefined;

    let res: data = await request.json();
    res = { ...res, bearerToken: bearerToken }
    console.log(res);

    const response: { status: number, statusText: string } | undefined = await sendData(res);
    console.log("reached here", response)

    if (response?.status != 201) {
        return new Response(JSON.stringify({ message: response?.statusText, success: false }), {
            status: response?.status,
            headers: corsHeaders,
        });
    }
    return new Response(JSON.stringify({ message: response?.statusText, success: true }), {
        status: 201,
        headers: corsHeaders,
    });
}
