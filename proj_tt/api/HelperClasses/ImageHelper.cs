using static System.Net.Mime.MediaTypeNames;

namespace TT_API.HelperClasses
{
    public class ImageHelper {

        public async void UploadImageLocal(string filename, IFormFile image) {

            using (var stream = new FileStream(@"C:\TT_LOCAL\" + filename, FileMode.Create)) {
                await image.CopyToAsync(stream);
            }
        }

        public async void DeleteImageLocal(string filename) {

            if (!filename.StartsWith(@"L\")) { return; }

            
        }
    }
}
