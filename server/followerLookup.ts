import { callDataApi } from './_core/dataApi';

interface FollowerLookupResult {
  success: boolean;
  followers: number; // in millions
  platform: string;
  error?: string;
}

/**
 * Look up follower count for a brand or artist across social media platforms
 * Tries multiple platforms and returns the highest follower count found
 */
export async function lookupFollowers(name: string): Promise<FollowerLookupResult> {
  if (!name || name.trim().length === 0) {
    return {
      success: false,
      followers: 0,
      platform: 'none',
      error: 'Name is required'
    };
  }

  const results: Array<{ platform: string; followers: number }> = [];

  try {
    // Try Twitter/X lookup
    try {
      const twitterResult = await callDataApi('Twitter/get_user_profile_by_username', {
        query: { username: name.replace('@', '').trim() }
      }) as any;

      if (twitterResult?.result?.data?.user?.result?.legacy?.followers_count) {
        const followers = twitterResult.result.data.user.result.legacy.followers_count;
        results.push({
          platform: 'Twitter',
          followers: followers / 1_000_000 // Convert to millions
        });
      }
    } catch (e) {
      console.log(`Twitter lookup failed for ${name}:`, e);
    }

    // Try YouTube lookup
    try {
      const youtubeResult = await callDataApi('Youtube/get_channel_details', {
        query: { 
          id: name.includes('youtube.com') ? name : `https://www.youtube.com/@${name.replace('@', '')}`,
          hl: 'en'
        }
      }) as any;

      if (youtubeResult?.stats?.subscribers) {
        // Parse subscriber count (e.g., "1.2M" or "150K")
        const subscriberText = youtubeResult.stats.subscribers.toString();
        let followers = 0;
        
        if (subscriberText.includes('M')) {
          followers = parseFloat(subscriberText.replace('M', '').replace(/[^0-9.]/g, ''));
        } else if (subscriberText.includes('K')) {
          followers = parseFloat(subscriberText.replace('K', '').replace(/[^0-9.]/g, '')) / 1000;
        } else {
          followers = parseInt(subscriberText.replace(/[^0-9]/g, '')) / 1_000_000;
        }

        if (followers > 0) {
          results.push({
            platform: 'YouTube',
            followers
          });
        }
      }
    } catch (e) {
      console.log(`YouTube lookup failed for ${name}:`, e);
    }

    // If no results found, return error
    if (results.length === 0) {
      return {
        success: false,
        followers: 0,
        platform: 'none',
        error: `Could not find follower data for "${name}". Please enter manually.`
      };
    }

    // Return the highest follower count found
    const best = results.reduce((max, current) => 
      current.followers > max.followers ? current : max
    );

    return {
      success: true,
      followers: Math.round(best.followers * 10) / 10, // Round to 1 decimal
      platform: best.platform
    };

  } catch (error) {
    return {
      success: false,
      followers: 0,
      platform: 'none',
      error: `Lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
