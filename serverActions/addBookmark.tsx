
// import { createClient } from "@/utils/supabase/server"
// import urlMetadata from "url-metadata"

type data = {
    categories: string,
    labels: [] | labelData[],
    link: string,
    email?: string,
    user_id?: string,
    bearerToken?: string | undefined
}
type labelData = {
    id: string,
    text: string
}

// export async function GetMetadata(link: string) {

//     const url = link
//     try {
//         const metadata = await urlMetadata(url);
//         // console.log(metadata)

//         return metadata.title
//     } catch (e) {
//         console.log(e)
//     }
//     return ""

// }


// export async function sendData(formData: data) {
//     console.log('recieved data - add bookmarks ', formData)

//     const supabase = await createClient()
//     const { data: { user } } = await supabase.auth.getUser()

//     if (formData) {

//         // console.log(formData.labels)

//         let metadata = await GetMetadata(formData.link)
//         metadata = metadata.length > 0 ? metadata : "Untitled"

//         const { data, status, statusText } = await supabase
//             .from('bookmarks')
//             .insert({
//                 user_id: user?.id,
//                 email: user?.email,
//                 categories: formData.categories,
//                 labels: formData.labels,
//                 link: formData.link,
//                 metadata: metadata
//             }, { count: 'planned' })
//             .select()

//         // refer docs - https://supabase.com/docs/reference/javascript/select
//         console.log('added bookmark', data, status, statusText)

//         return { status: status, statusText: statusText }
//     }

// }

export async function sendData(formData: data): Promise<{ status: number, statusText: string }> {
    try {
        console.log('Received data - add bookmarks', formData);

        const { createClient } = await import('@supabase/supabase-js');

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${formData.bearerToken || ""}`,
                    },
                },
            }
        );

        let metadata = "Untitled";
        try {
            const response = await fetch(formData.link, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; bookmark-fetcher/1.0)'
                }
            });

            if (response.ok) {
                const html = await response.text();
                const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
                if (titleMatch && titleMatch[1]) {
                    metadata = titleMatch[1].trim();
                }
            }
        } catch (e) {
            console.log('Error fetching metadata:', e);
        }

        const { data, error } = await supabase
            .from('bookmarks')
            .insert({
                user_id: formData?.user_id,
                email: formData?.email,
                categories: formData.categories,
                labels: formData.labels,
                link: formData.link,
                metadata: metadata
            })
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return { status: 500, statusText: error.message };
        }

        console.log('Added bookmark:', data);
        return { status: 201, statusText: "Bookmark added successfully" };

    } catch (error) {
        console.error('Error in sendData:', error, formData);
        return {
            status: 500,
            statusText: error instanceof Error ? error.message : "Internal server error"
        };
    }
}